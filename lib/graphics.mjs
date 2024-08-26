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

// scheme (255 << 24) | (B << 16) | (G << 8) | R;
const WHITE = (255 << 24) | (246 << 16) | (251 << 8) | 250;
const LIGHT_GRAY = (255 << 24) | (190 << 16) | (183 << 8) | 198;
const DARK_GRAY = (255 << 24) | (117 << 16) | (90 << 8) | 86;
const BLACK = (255 << 24) | (27 << 16) | (15 << 8) | 15;

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
    const lcdc = this.#memory.readByte(LCD_CONTROL_REGISTER);
    if (readBit(lcdc, 0)) this.#drawBackgroundAndWindow(lcdc);
    if (readBit(lcdc, 1)) this.#drawSprites(lcdc);
  }

  /**
   * The TileMap is a matrix of indexes of tiles in the TileData table. It represents what tiles are drawn.
   * The TileData table is a matrix of 8x8 tiles, where each tile is a 16 byte long array of bytes. These
   * bytes represent the color of each pixel in the tile.
   * 
   * TileData table can be read in two ways, either from 0x8000-0x8FFF or 0x8800-0x97FF, depending on LCDC.4.
   *   if LCDC.4 
   *     range = [0, 255] (-> [0x8000, 0x8FFF]) 
   *   else
   *     range = [-127, 0] (-> [0x8800, 0x8FFF]), [0, 127] (-> [0x9000, 0x97FF]) 
   * 
   * If LCDC.0 is 0, only sprites are drawn, background and window are blank. 
   * Else, we draw the background but we draw the window only if LCDC.5 is 1.
   * 
   *   if LCDC.0 == 0
   *     draw nothing
   *   else if LCDC.5 == 1
   *     draw window and background
   *   else
   *     draw background only
   * 
   * The window is drawn _on top_ of the background, if the window is enabled. If in the same position
   * there is both backround and window, only the window is drawn.
   * 
   * TileMap can be located in two places, either 0x9800-0x9BFF or 0x9C00-0x9FFF.
   * When drawing the background, we use the tile map that is selected by LCDC.3; when drawing the window,
   * we use the tile map that is selected by LCDC.6.
   * 
   *   backgroundTileMap = LCDC.3 ? [0x9800, 0x9BFF] : [0x9C00, 0x9FFF]
   *   windowTileMap = LCDC.6 ? [0x9800, 0x9BFF] : [0x9C00, 0x9FFF]
   * 
   * The position of the background is determined by the SCY and SCX registers,
   * top-left corner is at (SCX, SCY) and the bottom-right corner is at (SCX + 160, SCY + 144).
   * SCX, SCY are used to determine the subset of the TileMap that is drawn on the screen. 
   * The visible area wraps around (i.e., it's % 256).
   * 
   * @param {number} lcdc
   */
  #drawBackgroundAndWindow(lcdc) {
    const ly = this.#memory.readByte(SCANLINE_REGISTER);

    // Don't draw if the line is not visible
    if (ly < 0 || ly >= 144) return;

    // Tile Data
    const useSignedTileDataRange = !readBit(lcdc, 4);
    const tileDataRangeStart = useSignedTileDataRange ? 0x8800 : 0x8000

    // Background Map
    const bgTileMapRangeStart = readBit(lcdc, 3) ? 0x9C00 : 0x9800
    const bgX = this.#memory.readByte(0xFF43)
    const bgY = this.#memory.readByte(0xFF42)

    // Window Map
    const wTileMapRangeStart = readBit(lcdc, 6) ? 0x9C00 : 0x9800
    const wX = this.#memory.readByte(0xFF4B) - 7
    const wY = this.#memory.readByte(0xFF4A)

    const isWindowEnabled = readBit(lcdc, 5);

    for (let lx = 0; lx < 160; lx++) {
      // If the current point intersects with the window, we draw the window instead of the background
      const isDrawingWindow = isWindowEnabled && ly >= wY && lx >= wX;

      // Chose the coordinates of the tile in the TileMap, keeping in mind that they wrap
      const tileMapX = (isDrawingWindow ? (lx - wX) : (lx + bgX)) % 256;
      const tileMapY = (isDrawingWindow ? (ly - wY) : (ly + bgY)) % 256;

      // Tiles are 8x8, these are coordinates in index of col and row
      const tileMapCol = Math.floor(tileMapX / 8)
      const tileMapRow = Math.floor(tileMapY / 8);

      // Chose the TileMap range based on whether we are drawing the window or the background
      const tileMapRangeStart = isDrawingWindow ? wTileMapRangeStart : bgTileMapRangeStart;

      // There are 32 tiles in a row, this is a normal row-major indexing
      const tileIndex = this.#memory.readByte(tileMapRangeStart + tileMapCol + tileMapRow * 32, useSignedTileDataRange);

      const tileDataRow = useSignedTileDataRange ? (tileIndex + 128) : tileIndex
      const tileDataCol = (tileMapY % 8) * 2;

      // Each tile data item is a 16 byte long (https://gbdev.io/pandocs/single.html#vram-tile-data)
      const lineIndex = (tileDataRangeStart + tileDataCol + tileDataRow * 16) & 0xFFFF;
      const firstByte = this.#memory.readByte(lineIndex);
      const secondByte = this.#memory.readByte(lineIndex + 1);

      const colorBit = (7 - (tileMapX % 8)) & 0xFF;
      const colorNum = (+readBit(secondByte, colorBit) << 1) | +readBit(firstByte, colorBit);
      this.#screen.setPixel(lx, ly, this.#getColor(colorNum));
    }
  }

  /**
   * @param {number} lcdc
   */
  #drawSprites(lcdc) {
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

          const pixelX = x + 7 - pixel;
          const pixelY = currentLine;

          if (pixelX < 160 && pixelY < 144 && pixelX >= 0 && pixelY >= 0) {
            this.#screen.setPixel(pixelX, pixelY, this.#getColor(color));
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
      case 0: return WHITE;
      case 1: return LIGHT_GRAY;
      case 2: return DARK_GRAY;
      case 3: return BLACK;
      default: return BLACK;
    }
  }
}

export { Graphics, LCD_CONTROL_REGISTER, CYCLES_TO_DRAW_LINE };