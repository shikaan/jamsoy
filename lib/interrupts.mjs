// @ts-check

import { readBit, writeBit } from './cpu/registers.mjs';

const INTERRUPT_REQUEST_ADDRESS = 0xFF0F;
const INTERRUPT_ENABLE_ADDRESS = 0xFFFF;

class Interrupts {
  #memory;
  #registers;

  allowInterrupts = true;

  /**
   * @param {import('./types').Memory} memory
   * @param {import('./types').Register} registers
   */
  constructor(memory, registers) {
    this.#memory = memory;
    this.#registers = registers;
  }

  /**
   * @param {0|1|2|3} interrupt
   */
  requestInterrupt(interrupt) {
    const value = this.#memory.readByte(INTERRUPT_REQUEST_ADDRESS);
    this.#memory.writeByte(INTERRUPT_REQUEST_ADDRESS, writeBit(value, interrupt, true));
  }

  handleInterrupts() {
    if (this.allowInterrupts) {
      const request = this.#memory.readByte(INTERRUPT_REQUEST_ADDRESS);
      const enable = this.#memory.readByte(INTERRUPT_ENABLE_ADDRESS);

      if (request > 0) {
        for (let i = 0; i < 5; i++) {
          if (readBit(request, i) && readBit(enable, i)) {
            this.allowInterrupts = false;
            // mark the interrupt as handled
            this.#memory.writeByte(INTERRUPT_REQUEST_ADDRESS, writeBit(request, i, false));

            // push the current PC onto the stack
            this.#registers.SP -= 2;
            this.#memory.writeWord(this.#registers.SP, this.#registers.PC);

            // jump to the interrupt handler
            switch (i) {
              case 0:
                this.#registers.PC = 0x40;
                break;
              case 1:
                this.#registers.PC = 0x48;
                break;
              case 2:
                this.#registers.PC = 0x50;
                break;
              case 3:
                this.#registers.PC = 0x58;
                break;
              case 4:
                this.#registers.PC = 0x60;
                break;
            }
          }
        }
      }
    }
  }
}

export { Interrupts };