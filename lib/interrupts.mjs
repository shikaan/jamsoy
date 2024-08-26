// @ts-check

import { readBit, writeBit } from './cpu/registers.mjs';

const INTERRUPT_REQUEST_ADDRESS = 0xFF0F; // IF register
const INTERRUPT_ENABLE_ADDRESS = 0xFFFF; // IE register

/**
 * The number maps to the bit position in the interrupt request and enable registers
 * @enum {number}
 */
const INTERRUPT = {
  VBLANK: 0,
  LCD_STAT: 1,
  TIMER: 2,
  SERIAL: 3,
  JOYPAD: 4,
}

/**
 * The index maps to bit position in the interrupt request and enable registers
 */
const INTERRUPT_VECTOR = [
  0x40, // VBLANK
  0x48, // LCD STAT
  0x50, // TIMER
  0x58, // SERIAL
  0x60, // JOYPAD
]

class Interrupts {
  #memory;
  #registers;
  #IME = false;
  #cooldown = 0;

  /**
   * @param {import('./types').Memory} memory
   * @param {import('./types').Register} registers
   */
  constructor(memory, registers) {
    this.#memory = memory;
    this.#registers = registers;
  }

  get IME() {
    return this.#IME;
  }

  hasPendingInterrupts() {
    const request = this.#memory.readByte(INTERRUPT_REQUEST_ADDRESS);
    const enable = this.#memory.readByte(INTERRUPT_ENABLE_ADDRESS);
    return (request & enable & 0x1F) !== 0;
  }

  /**
   * @param {INTERRUPT} interrupt
   */
  requestInterrupt(interrupt) {
    const value = this.#memory.readByte(INTERRUPT_REQUEST_ADDRESS);
    this.#memory.writeByte(INTERRUPT_REQUEST_ADDRESS, writeBit(value, interrupt, true));
  }

  /**
   * @param {boolean} value 
   */
  enableInterrupts(value = true) {
    this.#IME = value;
    this.#cooldown = 1;
  }

  handleInterrupts() {
    if (this.#IME && this.#cooldown === 0 && this.hasPendingInterrupts()) {
      for (let i = 0; i < 5; i++) {
        const request = this.#memory.readByte(INTERRUPT_REQUEST_ADDRESS);
        const enable = this.#memory.readByte(INTERRUPT_ENABLE_ADDRESS);

        if (readBit(request, i) && readBit(enable, i)) {
          this.serviceInerrupt(request, i);
        }
      }
    }

    this.#cooldown = Math.max(0, this.#cooldown - 1);
  }

  /**
   * @param {number} request
   * @param {number} i
   */
  serviceInerrupt(request, i) {
    this.#IME = false;
    // mark the interrupt as handled
    this.#memory.writeByte(INTERRUPT_REQUEST_ADDRESS, writeBit(request, i, false));

    // push the current PC onto the stack
    this.#registers.SP -= 2;
    this.#memory.writeWord(this.#registers.SP, this.#registers.PC);

    // jump to the interrupt handler
    this.#registers.PC = INTERRUPT_VECTOR[i];
  }
}

export { Interrupts, INTERRUPT };