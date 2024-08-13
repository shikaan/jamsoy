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
    this.cpu.run(rom);
  }
}

export { GameBoy };