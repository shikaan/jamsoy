// @ts-check
import { Memory } from "./memory.mjs";
import { CPU } from "./cpu/cpu.mjs";
import { Timer } from "./timer.mjs";
import { register } from "./cpu/registers.mjs";
import { Interrupts } from "./interrupts.mjs";
import { Graphics } from "./graphics.mjs";
import { CanvasScreen } from "./screen.mjs";

class GameBoy {
  constructor(canvas) {
    this.memory = new Memory();
    this.register = register;
    this.interrupts = new Interrupts(this.memory, register);
    this.cpu = new CPU(this.memory, register, this.interrupts);
    this.timer = new Timer(this.memory, this.cpu);
    this.screen = new CanvasScreen(canvas);
    this.graphics = new Graphics(this.memory, this.interrupts, this.screen);
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
      // console.time("instruction");
      cycles += this.cpu.executeNextIntruction(rom);
      // console.timeEnd("instruction");

      // console.time("timer");
      this.timer.update(cycles);
      // console.timeEnd("timer");

      // console.time("graphics");
      this.graphics.update(cycles);
      // console.timeEnd("graphics");

      // console.time("interrupts");
      this.interrupts.handleInterrupts();
      // console.timeEnd("interrupts");
    }
    this.screen.draw();
  }

  #init() {
    this.memory.initialize();
    this.cpu.initialize();
    this.timer.initialize();
  }
}

export { GameBoy };