// @ts-check

import { readBit, writeBit } from "./cpu/registers.mjs";
import { INTERRUPT } from "./interrupts.mjs";

// Number of cycles required to draw a line
const CYCLES_TO_DRAW_LINE = 456;

// The address where the current scanline is stored
const SCANLINE_REGISTER = 0xFF44; // LY

const VISIBLE_SCANLINES = 144;
const TOTAL_SCANLINES = 154;

const PALETTE_REGISTER = 0xFF47;

// The address of the LCD status register
// The first two bits of this register are the mode (0, 1, 2, 3)
// The bit 2 is the coincidence flag (true if current line is the line the game wants, i.e. (FF44) == (FF45))
// The bit 3 is the mode 0 interrupt enable
// The bit 4 is the mode 1 interrupt enable
// The bit 5 is the mode 2 interrupt enable
// The bit 6 is the coincidence interrupt enable
const LCD_STATUS_REGISTER = 0xFF41;

// The address of the LCD control register
// Bit 0 is the background enable
// Bit 1 is the sprites enable
// Bit 2 is the sprites size
// Bit 3 is the background tile map select
// Bit 4 is the background and window tile data select
// Bit 5 is the window enable
// Bit 6 is the window tile map select
// Bit 7 is the LCD enable
const LCD_CONTROL_REGISTER = 0xFF40;

// The address of the scanline requested by the game
const GAME_SCANLINE_REGISTER = 0xFF45;  // LYC

const SPRITE_ATTRIBUTE_TABLE_REGISTER = 0xFE00;

const LCD_MODE = {
  HBLANK: 0b00,
  VBLANK: 0b01,
  OAM: 0b10, // Accessing Object Attribute Memory
  VRAM: 0b11, // Transferring Data to LCD Driver
}

// If the number of cycles is greater than this, the mode is 2 
const MODE_2_CYCLES = 376;
// If the number of cycles is greater than this, the mode is 3 
const MODE_3_CYCLES = 204;

const PALETTE_RANGES = [
  [0, 1], // White
  [2, 3], // Light gray
  [4, 5], // Dark gray
  [6, 7], // Black
]


class Graphics {
  #memory;
  #interrupts;
  #cycles;
  #screen;

  /**
   * @param {import("./types").Memory} memory
   * @param {import("./types").Interrupts} interrupts
   * @param {import("./types").Screen} screen
   */
  constructor(memory, interrupts, screen) {
    this.#memory = memory;
    this.#interrupts = interrupts;
    this.#screen = screen;
    this.#cycles = 0;
  }

  #readStatusMode() {
    return this.#memory.readByte(LCD_STATUS_REGISTER) & 0b00000011;
  }

  #writeStatusMode(mode) {
    const status = this.#memory.readByte(LCD_STATUS_REGISTER);
    this.#memory.writeByte(LCD_STATUS_REGISTER, (status & 0b11111100) | mode);
  }

  /**
   * @param {number} cycles
   */
  update(cycles) {
    if (!this.#isLCDEnabled()) {
      this.#cycles = 0;
      this.#memory.unsafeWriteByte(SCANLINE_REGISTER, 0);
      this.#writeStatusMode(LCD_MODE.HBLANK);
    }

    let requestVBlankInterrupt = false;
    let requestStatInterrupt = false;

    this.#cycles += cycles;
    const oldMode = this.#readStatusMode();

    let newMode;
    if (this.#memory.readByte(SCANLINE_REGISTER) >= VISIBLE_SCANLINES) {
      // Mode 1
      newMode = LCD_MODE.VBLANK;
      requestStatInterrupt = readBit(this.#memory.readByte(LCD_STATUS_REGISTER), 4);
    } else if (this.#cycles <= MODE_3_CYCLES) {
      // Mode 3
      newMode = LCD_MODE.VRAM;
      if (oldMode !== newMode) {
        this.#drawScanline();
      }
    } else if (this.#cycles <= MODE_2_CYCLES) {
      // Mode 2
      newMode = LCD_MODE.OAM;
      requestStatInterrupt = readBit(this.#memory.readByte(LCD_STATUS_REGISTER), 5);
    } else {
      // Mode 0
      newMode = LCD_MODE.HBLANK;
      requestStatInterrupt = readBit(this.#memory.readByte(LCD_STATUS_REGISTER), 3);
    }
    this.#writeStatusMode(newMode);
    let statInterrupt = requestStatInterrupt && oldMode !== newMode;

    if (this.#memory.readByte(SCANLINE_REGISTER) === this.#memory.readByte(GAME_SCANLINE_REGISTER)) {
      const status = this.#memory.readByte(LCD_STATUS_REGISTER);
      this.#memory.writeByte(LCD_STATUS_REGISTER, writeBit(status, 2, true));
      statInterrupt = readBit(status, 6);
    } else {
      const status = this.#memory.readByte(LCD_STATUS_REGISTER);
      this.#memory.writeByte(LCD_STATUS_REGISTER, writeBit(status, 2, false));
    }

    if (this.#cycles >= CYCLES_TO_DRAW_LINE) {
      this.#cycles = 0;
      const currentLine = this.#memory.readByte(SCANLINE_REGISTER) + 1;
      this.#memory.writeByte(SCANLINE_REGISTER, currentLine);

      if (currentLine > TOTAL_SCANLINES) {
        this.#memory.writeByte(SCANLINE_REGISTER, 0);
      }

      if (currentLine === VISIBLE_SCANLINES) {
        requestVBlankInterrupt = true;
      }
    }

    if (requestVBlankInterrupt) this.#interrupts.requestInterrupt(INTERRUPT.VBLANK);
    if (statInterrupt) this.#interrupts.requestInterrupt(INTERRUPT.LCD_STAT);
  }

  #isLCDEnabled() {
    return readBit(this.#memory.readByte(LCD_CONTROL_REGISTER), 7);
  }

  #drawScanline() {
    this.#drawBackgroundAndWindow();
    this.#drawSprites();
  }

  /**
   * -- Reading a background or window tile data --
   * * if LCDC.4 == 0, then the range [-127, 0] -> [0x8800, 0x8FFF], [0, 127] -> [0x9000, 0x97FF]
   * * if LCDC.4 == 1, then the range [0, 255] -> [0x8000, 0x8FFF]
   * 
   * -- Tile Maps --
   * There are two tile maps at 9800-9BFF and 9C00-9FFF, they can both be used for drawing the 
   * background and window. They contain 1-byte indexes of the tiles in the tile data table.
   * A tile map is literally a matrix of tiles, where each tile is 8x8 pixels. SCX, SCY are used
   * to determine the subset of this matrix that is drawn on the screen.
   * The position of the background is determined by the SCY and SCX registers,
   * top-left corner is at (SCX, SCY) and the bottom-right corner is at (SCX + 160, SCY + 144).
   * It determines the subset of the background map. The visible area wraps around.
   * 
   * -- Drawing a tile --
   * if LCDC.0 == 0, then background and window are blank, 
   *                    it takes priority over LCDC.5, but objects are still displayed
   * if LCDC.0 == 1, then we check LCDC.5 to see if the window is displayed
   * 
   * -- Chosing tile maps --
   * if LCDC.6 == 0, then window uses 9800-9BFF, else uses 9C00-9FFF
   * if LCDC.3 == 0, then background uses 9800-9BFF, else use 9C00-9FFF
   */
  #drawBackgroundAndWindow() {
    const ly = this.#memory.readByte(SCANLINE_REGISTER);
    if (ly < 0 || ly >= 144) return;

    const lcdc = this.#memory.readByte(LCD_CONTROL_REGISTER);

    // Early return if neither window or background are enabled
    if (!readBit(lcdc, 0)) return;

    // These are the base addresses of the tile maps and tile data
    const signedTileDataRange = !readBit(lcdc, 4);
    const backgroundTileDataStart = signedTileDataRange ? 0x8800 : 0x8000
    const backgroundTileMapStart = readBit(lcdc, 3) ? 0x9C00 : 0x9800
    const [backgroundX, backgroundY] = [this.#memory.readByte(0xFF43), this.#memory.readByte(0xFF42)];

    // Y Position of the current line relative to the background position 
    const tileMapY = ((ly + backgroundY) % 256);

    for (let lx = 0; lx < 160; lx++) {
      const tileMapX = lx + backgroundX
      // Tiles are 8x8, these are coordinates in index of col and row
      const [tileMapCol, tileMapRow] = [Math.floor(tileMapX / 8), Math.floor(tileMapY / 8)];
      // There are 32 tiles in a row, this is a normal row-major indexing
      const tileIndex = this.#memory.readByte(backgroundTileMapStart + tileMapCol + tileMapRow * 32, signedTileDataRange);

      const tileDataRow = signedTileDataRange ? (tileIndex + 128) : tileIndex
      const tileDataCol = (tileMapY % 8) * 2;

      // Each tile data item is a 16 byte long (https://gbdev.io/pandocs/single.html#vram-tile-data)
      const lineIndex = (backgroundTileDataStart + tileDataCol + tileDataRow * 16) & 0xFFFF;
      const [firstByte, secondByte] = [this.#memory.readByte(lineIndex), this.#memory.readByte(lineIndex + 1)]

      let colorBit = (tileMapX % 8) - 7;
      colorBit = -colorBit; // Multiply by -1 to invert the sign
      colorBit = colorBit & 0xFF; // Ensure it's treated as an 8-bit unsigned integer

      const colorNum = (+readBit(secondByte, colorBit) << 1) | +readBit(firstByte, colorBit);
      const [r, g, b] = this.#getColor(colorNum);
      this.#screen.setPixel(lx, ly, r, g, b);
    }
  }

  #drawSprites() {
    const lcdc = this.#memory.readByte(LCD_CONTROL_REGISTER);
    if (!readBit(lcdc, 1)) return;

    // Large sprites are 8x16, small sprites are 8x8
    const useLargeSprites = readBit(lcdc, 2);

    const ySize = useLargeSprites ? 16 : 8;

    // Gameboy can draw up to 40 sprites
    for (let sprite = 0; sprite < 40; sprite++) {
      const index = sprite * 4; // Each sprite is 4 bytes
      const y = this.#memory.readByte(SPRITE_ATTRIBUTE_TABLE_REGISTER + index) - 16;
      const x = this.#memory.readByte(SPRITE_ATTRIBUTE_TABLE_REGISTER + index + 1) - 8;
      const tile = this.#memory.readByte(SPRITE_ATTRIBUTE_TABLE_REGISTER + index + 2);
      const attributes = this.#memory.readByte(SPRITE_ATTRIBUTE_TABLE_REGISTER + index + 3);

      const [xFlip, yFlip] = [readBit(attributes, 5), readBit(attributes, 6)];
      const currentLine = this.#memory.readByte(SCANLINE_REGISTER);

      // Check intersection of sprite with current line
      if (currentLine >= y && currentLine < y + ySize) {
        // read sprite backwards if it's flipped
        const line = yFlip ? (ySize + y - currentLine) : currentLine - y;

        const dataAddress = 0x8000 + (tile * 16) + (line * 2);
        const data1 = this.#memory.readByte(dataAddress);
        const data2 = this.#memory.readByte(dataAddress + 1);

        for (let pixel = 7; pixel >= 0; pixel--) {
          const colorBit = xFlip ? 7 - pixel : pixel;
          const color = (+readBit(data2, colorBit) << 1) | +readBit(data1, colorBit);

          if (color === 0) {
            // White is transparent for sprites
            continue;
          }

          const [r, g, b] = this.#getColor(color);

          const pixelX = x + 7 - pixel;
          const pixelY = currentLine;

          if (pixelX < 160 && pixelY < 144 && pixelX >= 0 && pixelY >= 0) {
            this.#screen.setPixel(pixelX, pixelY, r, g, b);
          }
        }
      }
    }
  }

  /**
   * @param {number} colorNum
   */
  #getColor(colorNum) {
    const palette = this.#memory.readByte(PALETTE_REGISTER);
    const [start, end] = PALETTE_RANGES[colorNum];
    const color = +readBit(palette, end) << 1 | +readBit(palette, start);

    switch (color) {
      case 0: return [255, 255, 255];
      case 1: return [192, 192, 192];
      case 2: return [96, 96, 96];
      case 3: return [0, 0, 0];
      default: return [0, 0, 0];
    }
  }
}

export { Graphics, LCD_CONTROL_REGISTER, CYCLES_TO_DRAW_LINE };