// @ts-check
import { readBit } from "./bits.mjs";
import { INTERRUPT } from "./interrupts.mjs";

/**
 * DIV
 */
const DIVIDER_ADDRESS = 0xff04;
/**
 * TIMA
 */
const TIMER_COUNTER_ADDRESS = 0xff05;
/**
 * TMA
 */
const TIMER_MODULO_ADDRESS = 0xff06;
/**
 * TAC
 */
const TIMER_CONTROL_ADDRESS = 0xff07;

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

  /**
   * @param {number} tCycles
   */
  update(tCycles) {
    this.#dividerCounter += tCycles;
    if (this.#dividerCounter >= 256) {
      this.#dividerCounter -= 256;
      // If we wrote safely, we would reset the counter here (see trap in memory.mjs)
      this.#memory.unsafeWriteByte(
        DIVIDER_ADDRESS,
        this.#memory.unsafeReadByte(DIVIDER_ADDRESS) + 1,
      );
    }

    if (!this.#isClockEnabled()) return;

    this.#clockCounter += tCycles;
    const frequency = this.#getClockFrequencyFromTimerController();

    while (this.#clockCounter >= frequency) {
      this.#clockCounter -= frequency;
      const tima = this.#memory.readByte(TIMER_COUNTER_ADDRESS);

      if (tima === 0xff) {
        const tma = this.#memory.readByte(TIMER_MODULO_ADDRESS);
        this.#memory.writeByte(TIMER_COUNTER_ADDRESS, tma);
        this.#interrupts.requestInterrupt(INTERRUPT.TIMER);
      } else {
        this.#memory.writeByte(
          TIMER_COUNTER_ADDRESS,
          this.#memory.readByte(TIMER_COUNTER_ADDRESS) + 1,
        );
      }
    }
  }

  initialize() {
    this.#clockCounter = 1024;
    this.#dividerCounter = 0;
  }

  #isClockEnabled() {
    return readBit(this.#memory.readByte(TIMER_CONTROL_ADDRESS), 2);
  }

  #getClockFrequencyFromTimerController() {
    return CLOCK_FREQUENCY_BY_TIMER_CONTROLLER[
      this.#memory.readByte(TIMER_CONTROL_ADDRESS) & 0b11
    ];
  }
}

export {
  Timer,
  TIMER_CONTROL_ADDRESS,
  TIMER_COUNTER_ADDRESS,
  TIMER_MODULO_ADDRESS,
  DIVIDER_ADDRESS,
};
