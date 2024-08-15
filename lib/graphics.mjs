// @ts-check

import { readBit, writeBit } from "./cpu/registers.mjs";

// Number of cycles required to draw a line
const CYCLES_TO_DRAW_LINE = 456;
// The address where the current scanline is stored
const SCANLINE_REGISTER = 0xFF44;

const VISIBLE_SCANLINES = 144;
const TOTAL_SCANLINES = 154;

// The address of the LCD status register
// The first two bits of this register are the mode (0, 1, 2, 3)
// The bit 2 is the coincidence flag (true if current line is the line the game wants, i.e. (FF44) == (FF45))
// The bit 3 is the mode 0 interrupt enable
// The bit 4 is the mode 1 interrupt enable
// The bit 5 is the mode 2 interrupt enable
// The bit 6 is the coincidence interrupt enable
const LCD_STATUS_REGISTER = 0xFF41;

// Bit 7 is the LCD enable
const LCD_CONTROL_REGISTER = 0xFF40;

// The address of the scanline requested by the game
const GAME_SCANLINE_REGISTER = 0xFF45;

const LCD_MODE = {
  HBLANK: 0b00,
  VBLANK: 0b01,
  OAM: 0b10, // Searching Sprite Attrib
  VRAM: 0b11, // Transferring Data to LCD Driver
}

// If the number of cycles is greater than this, the mode is 2 
const MODE_2_CYCLES = 376;
// If the number of cycles is greater than this, the mode is 3 
const MODE_3_CYCLES = 204;

class Graphics {
  #memory;
  #interrupts;
  #cycles;

  /**
   * @param {import("./types").Memory} memory
   * @param {import("./types").Interrupts} interrupts
   */
  constructor(memory, interrupts) {
    this.#memory = memory;
    this.#interrupts = interrupts;
    this.#cycles = CYCLES_TO_DRAW_LINE;
  }

  /**
   * @param {number} cycles
   */
  update(cycles) {
    this.#setLCDStatus();

    // if (isLCDEnabled()) {
    this.#cycles -= cycles;
    // } else {
    // return
    // }

    if (this.#cycles <= 0) {
      const currentLine = this.#memory.readByte(SCANLINE_REGISTER) + 1;
      this.#memory.unsafeWriteByte(SCANLINE_REGISTER, currentLine);
      this.#cycles = CYCLES_TO_DRAW_LINE;

      // Screen is done drawing
      if (currentLine === VISIBLE_SCANLINES) {
        this.#interrupts.requestInterrupt(0);
        // Screen is done drawing and VBlank is starting
      } else if (currentLine > TOTAL_SCANLINES) {
        this.#memory.unsafeWriteByte(SCANLINE_REGISTER, 0);
        // Draw the current line
      } else if (currentLine < VISIBLE_SCANLINES) {
        // this.drawScanline();
      }
    }
  }

  #setLCDStatus() {
    const currentStatus = this.#memory.readByte(LCD_STATUS_REGISTER);

    if (!this.#isLCDEnabled()) {
      this.#cycles = CYCLES_TO_DRAW_LINE;
      this.#memory.unsafeWriteByte(SCANLINE_REGISTER, 0);
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
}

export { Graphics };