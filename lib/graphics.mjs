// @ts-check

import { readBit, writeBit } from "./cpu/registers.mjs";

// Number of cycles required to draw a line
const CYCLES_TO_DRAW_LINE = 456;
// The address where the current scanline is stored
const SCANLINE_REGISTER = 0xFF44;

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
const GAME_SCANLINE_REGISTER = 0xFF45;

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
    this.#cycles = CYCLES_TO_DRAW_LINE;
    this.#screen = screen;
  }

  /**
   * @param {number} cycles
   */
  update(cycles) {
    this.#setLCDStatus();

    if (this.#isLCDEnabled()) {
      this.#cycles -= cycles;
    } else {
      return
    }

    if (this.#cycles <= 0) {
      const currentLine = this.#memory.readByte(SCANLINE_REGISTER) + 1;
      this.#memory.unsafeWriteLocalByte(SCANLINE_REGISTER, currentLine);
      this.#cycles = CYCLES_TO_DRAW_LINE;

      // Screen is done drawing
      if (currentLine === VISIBLE_SCANLINES) {
        this.#interrupts.requestInterrupt(0);
        // Screen is done drawing and VBlank is starting
      } else if (currentLine > TOTAL_SCANLINES) {
        this.#memory.unsafeWriteLocalByte(SCANLINE_REGISTER, 0);
        // Draw the current line
      } else if (currentLine < VISIBLE_SCANLINES) {
        this.#drawScanline();
      }
    }
  }

  #setLCDStatus() {
    const currentStatus = this.#memory.readByte(LCD_STATUS_REGISTER);

    if (!this.#isLCDEnabled()) {
      this.#cycles = CYCLES_TO_DRAW_LINE;
      this.#memory.unsafeWriteLocalByte(SCANLINE_REGISTER, 0);
      this.#memory.writeByte(LCD_STATUS_REGISTER, currentStatus & 0b11111100);
      return;
    }

    const currentLine = this.#memory.readByte(SCANLINE_REGISTER);
    const currentMode = currentStatus & 0b00000011;
    let mode = LCD_MODE.HBLANK, requestInterrupt = false, status = currentStatus;

    if (currentLine >= VISIBLE_SCANLINES) {
      mode = LCD_MODE.VBLANK;
      status = writeBit(status, 0, true);
      status = writeBit(status, 1, false);
      requestInterrupt = readBit(status, 4);
    } else {
      // After a certain number of cycles, the mode changes
      if (this.#cycles >= MODE_2_CYCLES) {
        mode = LCD_MODE.OAM;
        status = writeBit(status, 0, false);
        status = writeBit(status, 1, true);
        requestInterrupt = readBit(status, 5);
      } else if (this.#cycles >= MODE_3_CYCLES) {
        mode = LCD_MODE.VRAM;
        status = writeBit(status, 0, true);
        status = writeBit(status, 1, true);
      } else {
        mode = LCD_MODE.HBLANK;
        status = writeBit(status, 0, false);
        status = writeBit(status, 1, false);
        requestInterrupt = readBit(status, 3);
      }
    }

    if (requestInterrupt && mode !== currentMode) {
      this.#interrupts.requestInterrupt(1);
    }

    if (currentLine === this.#memory.readByte(GAME_SCANLINE_REGISTER)) {
      status = writeBit(status, 2, true);
      if (readBit(status, 6)) {
        this.#interrupts.requestInterrupt(1);
      }
    } else {
      status = writeBit(status, 2, false);
    }

    this.#memory.writeByte(LCD_STATUS_REGISTER, status);
  }

  #isLCDEnabled() {
    return readBit(this.#memory.readByte(LCD_CONTROL_REGISTER), 7);
  }

  #drawScanline() {
    const control = this.#memory.readByte(LCD_CONTROL_REGISTER);
    const backgroundEnabled = readBit(control, 0);
    const spritesEnabled = readBit(control, 1);
    if (backgroundEnabled) {
      this.#drawBackground();
    }
    if (spritesEnabled) {
      this.#drawSprites();
    }
  }

  #drawBackground() {
    const currentLine = this.#memory.readByte(SCANLINE_REGISTER);
    const control = this.#memory.readByte(LCD_CONTROL_REGISTER);
    // Position of the background
    const scrollY = this.#memory.readByte(0xFF42);
    const scrollX = this.#memory.readByte(0xFF43);
    // Position of the window
    const windowY = this.#memory.readByte(0xFF4A);
    const windowX = this.#memory.readByte(0xFF4B) - 7; // Subtract 7 because the window is offset by 7 pixels

    const isWindowEnabled = readBit(control, 5);
    const isLineInView = windowY <= this.#memory.readByte(SCANLINE_REGISTER);
    const usingWindow = isWindowEnabled && isLineInView;

    // The tile data is stored in two different locations
    // 0x8000-0x8FFF or 0x8800-0x97FF - determined by bit 4 of the LCD control register
    const tileBaseAddress = readBit(control, 4) ? 0x8000 : 0x8800;
    // The tile number is signed if the tile data is stored in 0x8800-0x97FF
    const signed = tileBaseAddress === 0x8800;

    const tileMapBaseAddress = usingWindow
      ? readBit(control, 6) ? 0x9C00 : 0x9800  // Window tile map
      : readBit(control, 3) ? 0x9C00 : 0x9800; // Background tile map

    const tileY = usingWindow
      ? this.#memory.readByte(SCANLINE_REGISTER) - windowY
      : this.#memory.readByte(SCANLINE_REGISTER) + scrollY;

    const tileRow = Math.floor(tileY / 8) * 32;

    for (let pixelX = 0; pixelX < 160; pixelX++) {
      const tileX = usingWindow && pixelX >= windowX
        ? pixelX - windowX
        : pixelX + scrollX;

      const tileCol = Math.floor(tileX / 8);
      const tileNum = this.#memory.readByte(tileMapBaseAddress + tileRow + tileCol, signed);

      const tileAddress = signed
        ? tileBaseAddress + (tileNum + 128) * 16
        : tileBaseAddress + tileNum * 16;

      const line = (tileY % 8) * 2; // Each line is 2 bytes
      const data1 = this.#memory.readByte(tileAddress + line);
      const data2 = this.#memory.readByte(tileAddress + line + 1);

      const colorBit = 7 - (tileX % 8);
      const colorNum = (+readBit(data2, colorBit) << 1) | +readBit(data1, colorBit);

      const [r, g, b] = this.#getColor(colorNum);

      if (pixelX < 160 && currentLine < 144 && pixelX >= 0 && currentLine >= 0) {
        this.#screen.setPixel(pixelX, currentLine, r, g, b);
      }
    }
  }

  #drawSprites() {
    // Large sprites are 8x16, small sprites are 8x8
    const useLargeSprites = readBit(this.#memory.readByte(LCD_CONTROL_REGISTER), 2);

    const ySize = useLargeSprites ? 16 : 8;

    // Gameboy can draw up to 40 sprites
    for (let sprite = 0; sprite < 40; sprite++) {
      const index = sprite * 4; // Each sprite is 4 bytes
      const y = this.#memory.readByte(SPRITE_ATTRIBUTE_TABLE_REGISTER + index) - 16;
      const x = this.#memory.readByte(SPRITE_ATTRIBUTE_TABLE_REGISTER + index + 1) - 8;
      const tile = this.#memory.readByte(SPRITE_ATTRIBUTE_TABLE_REGISTER + index + 2);
      const attributes = this.#memory.readByte(SPRITE_ATTRIBUTE_TABLE_REGISTER + index + 3);

      const [yFlip, xFlip] = [readBit(attributes, 5), readBit(attributes, 6)];
      const currentLine = this.#memory.readByte(SCANLINE_REGISTER);

      // Check intersection of sprite with current line
      if (currentLine >= y && currentLine < y + ySize) {
        // read sprite backwards if it's flipped
        const line = yFlip ? (ySize - 1 - currentLine - y) : currentLine - y;

        const dataAddress = 0x8000 + tile * 16 + line * 2;
        const data1 = this.#memory.readByte(dataAddress);
        const data2 = this.#memory.readByte(dataAddress + 1);

        for (let pixel = 0; pixel < 8; pixel++) {
          const colorBit = xFlip ? pixel : 7 - pixel;
          const colorNum = +readBit(data2, colorBit) << 1 | +readBit(data1, colorBit);

          // White is transparent for sprites
          if (colorNum === 0) {
            continue;
          }

          const [r, g, b] = this.#getColor(colorNum);

          const pixelX = x + pixel;
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
      case 0: return [155, 188, 15];
      case 1: return [139, 172, 15];
      case 2: return [48, 98, 48];
      case 3: return [15, 56, 15];
      default: return [15, 56, 15];
    }
  }
}

export { Graphics, LCD_CONTROL_REGISTER, CYCLES_TO_DRAW_LINE };