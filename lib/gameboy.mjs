// @ts-check
import { Memory } from "./memory.mjs";
import { CPU } from "./cpu/cpu.mjs";

class GameBoy {
  constructor() {
    this.memory = new Memory();
    this.cpu = new CPU(this.memory);
  }

  /**
   * @param {Uint8Array} rom
   */
  loadROM(rom) {
    this.memory.loadROM(rom);
    this.#init();
  }

  update() {
    const rom = this.memory.getROM();
    let cycles = 0;
    while (cycles < CPU.MAX_CYCLES) {
      cycles += this.cpu.executeNextIntruction(rom);
      // timers
      // gfx
      // interrupts
    }
    // render
  }

  #init() {
    this.memory.initialize();
    this.cpu.initialize();
  }
}

export { GameBoy };