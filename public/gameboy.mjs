// @ts-check
import { Memory } from "../lib/memory.mjs";
import { CPU } from "../lib/cpu/cpu.mjs";
import { Timer } from "../lib/timer.mjs";
import { register } from "../lib/cpu/registers.mjs";
import { Interrupts } from "../lib/interrupts.mjs";
import { Graphics } from "../lib/graphics.mjs";
import { CanvasScreen } from "../lib/screen.mjs";

class GameBoy {
  constructor(canvas) {
    this.memory = new Memory();
    this.register = register;
    this.interrupts = new Interrupts(this.memory, register);
    this.cpu = new CPU(this.memory, register, this.interrupts);
    this.timer = new Timer(this.memory, this.cpu);
    this.screen = new CanvasScreen(canvas);
    this.graphics = new Graphics(this.memory, this.interrupts, this.screen);

    let buffer = '';
    this.memory.onSerial((char) => {
      if (char === '\n') {
        console.log(buffer);
        buffer = '';
      } else {
        buffer += char;
      }
    })
  }

  /**
   * @param {Uint8Array} rom
   */
  loadROM(rom) {
    this.memory.loadROM(rom);
    this.#init();
  }

  update() {
    let cycles = 0;
    while (cycles < CPU.MAX_CYCLES) {
      // console.time("instruction");
      cycles += this.cpu.executeNextIntruction();
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