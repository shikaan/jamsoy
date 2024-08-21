// @ts-check

import { readBit } from "./cpu/registers.mjs";

const DIVIDER_ADDRESS = 0xFF04;       // DIV
const TIMER_COUNTER_ADDRESS = 0xFF05; // TIMA
const TIMER_MODULO_ADDRESS = 0xFF06;  // TMA
const TIMER_CONTROL_ADDRESS = 0xFF07; // TAC

const CLOCK_FREQUENCY_BY_TIMER_CONTROLLER = [1024, 16, 64, 256];

class Timer {
  #memory;
  #interrupts;
  #clockCounter;
  #dividerCounter;

  /**
   * @param {import("./types").Memory} memory
   * @param {import("./types").Interrupts} interrupts
   */
  constructor(memory, interrupts) {
    this.#memory = memory;
    this.#interrupts = interrupts;

    this.#clockCounter = 0;
    this.#dividerCounter = 0;
  }

  update(cycles) {
    this.#updateDividerRegister(cycles);

    if (!this.#isClockEnabled()) return;

    this.#clockCounter += cycles;
    const frequency = this.#getClockFrequencyFromTimerController();

    if (this.#clockCounter >= frequency) {
      this.#clockCounter -= frequency;
      const tima = this.#memory.readByte(TIMER_COUNTER_ADDRESS);

      if (tima === 0xFF) {
        const tma = this.#memory.readByte(TIMER_MODULO_ADDRESS);
        this.#memory.unsafeWriteByte(TIMER_COUNTER_ADDRESS, tma);
        this.#interrupts.requestInterrupt(2);
      } else {
        this.#unsafeIncrement(TIMER_COUNTER_ADDRESS);
      }
    }
  }

  initialize() {
    this.#clockCounter = 1024;
  }

  #isClockEnabled() {
    return readBit(this.#memory.readByte(TIMER_CONTROL_ADDRESS), 2);
  }

  #getClockFrequencyFromTimerController(value = this.#memory.readByte(TIMER_CONTROL_ADDRESS)) {
    return CLOCK_FREQUENCY_BY_TIMER_CONTROLLER[value & 0b11];
  }

  #updateDividerRegister(cycles) {
    this.#dividerCounter += cycles;
    if (this.#dividerCounter > 255) {
      this.#dividerCounter = 0;
      // We don't want the callbak to fire in this case
      this.#unsafeIncrement(DIVIDER_ADDRESS, cycles);
    }
  }

  #unsafeIncrement(address, amount = 1) {
    const value = this.#memory.unsafeReadByte(address);
    this.#memory.unsafeWriteByte(address, value + amount);
  }
}

export { Timer }