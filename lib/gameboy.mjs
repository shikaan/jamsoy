// @ts-check
import { Memory } from "./memory.mjs";
import { CPU } from "./cpu/cpu.mjs";
import { Timer } from "./timer.mjs";

class GameBoy {
  constructor() {
    this.memory = new Memory();
    this.cpu = new CPU(this.memory);
    this.timer = new Timer(this.memory, this.cpu);
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
      this.timer.update(cycles);
      // gfx
      // interrupts
    }
    // render
  }

  #init() {
    this.memory.initialize();
    this.cpu.initialize();
    this.timer.initialize();
  }
}

export { GameBoy };