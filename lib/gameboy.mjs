// @ts-check
import { Memory } from "./memory.mjs";
import { CPU } from "./cpu/cpu.mjs";
import { Timer } from "./timer.mjs";
import { register } from "./cpu/registers.mjs";
import { Interrupts } from "./interrupts.mjs";
import { Graphics } from "./graphics.mjs";

class GameBoy {
  constructor() {
    this.memory = new Memory();
    this.register = register;
    this.interrupts = new Interrupts(this.memory, register);
    this.cpu = new CPU(this.memory, register, this.interrupts);
    this.timer = new Timer(this.memory, this.cpu);
    this.graphics = new Graphics(this.memory, this.interrupts);
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
      this.interrupts.handleInterrupts();
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