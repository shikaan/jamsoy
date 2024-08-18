// @ts-check

const TIMER_ADDRESS = 0xFF05;
const TIMER_MODULATOR_ADDRESS = 0xFF06;
const TIMER_CONTROLLER_ADDRESS = 0xFF07;
const TIMER_DIVIDER_ADDRESS = 0xFF04;

class Timer {
  /**
   * @param {import("./types").Memory} memory
   * @param {import("./types").CPU} cpu
   */
  constructor(memory, cpu) {
    this.memory = memory;
    this.cpu = cpu;
    this.clockCounter = 1024;
    this.dividerCounter = 0;

    this.memory.onWrite(TIMER_CONTROLLER_ADDRESS, (value, oldValue) => {
      const newClockFrequency = this.#getClockFrequencyFromTimerController(value);
      const oldClockFrequency = this.#getClockFrequencyFromTimerController(oldValue);
      if (newClockFrequency !== oldClockFrequency) {
        this.#setClockFrequency();
      }
    });

    this.memory.onWrite(TIMER_DIVIDER_ADDRESS, () => {
      this.dividerCounter = 0;
    })
  }

  update(cycles) {
    this.#updateDividerRegister(cycles);

    if (this.#isClockEnabled()) {
      this.clockCounter -= cycles;

      if (this.clockCounter <= 0) {
        this.#setClockFrequency()

        if (this.memory.readByte(TIMER_ADDRESS) === 255) {
          const tma = this.memory.readByte(TIMER_MODULATOR_ADDRESS);
          this.memory.writeByte(TIMER_ADDRESS, tma);
          // request interrupt
        }
      } else {
        this.#increaseByte(TIMER_ADDRESS);
      }
    }
  }

  initialize() {
    this.#setClockFrequency();
  }

  #isClockEnabled() {
    // checks if bit 2 is set
    return (this.memory.readByte(TIMER_CONTROLLER_ADDRESS) & 0b100) === 0b100;
  }

  #getClockFrequencyFromTimerController(value = this.memory.readByte(TIMER_CONTROLLER_ADDRESS)) {
    return value & 0x3;
  }

  #setClockFrequency() {
    const clockFrequency = this.#getClockFrequencyFromTimerController();
    switch (clockFrequency) {
      case 0:
        this.clockCounter = 1024; // CPU.CLOCK_SPEED / 4096 Hz
        break;
      case 1:
        this.clockCounter = 16; // CPU.CLOCK_SPEED / 262144 Hz
        break;
      case 2:
        this.clockCounter = 64; // CPU.CLOCK_SPEED / 65536 Hz
        break;
      case 3:
        this.clockCounter = 256; // CPU.CLOCK_SPEED / 16384 Hz
        break;
    }
  }

  #updateDividerRegister(cycles) {
    this.dividerCounter += cycles;
    if (this.dividerCounter >= 250) {
      this.dividerCounter = 0;
      this.#increaseByte(TIMER_DIVIDER_ADDRESS);
    }
  }

  #increaseByte(address) {
    this.memory.writeByte(address, this.memory.readByte(address) + 1);
  }
}

export { Timer }