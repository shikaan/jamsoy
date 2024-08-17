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

    this.memory.onWrite(0xFF01, (v) => {
      console.log('0xFF01')
      console.log(v)
    });

    this.memory.onWrite(0xFF02, (v) => {
      console.log('0xFF02')
      console.log(v)
    });
  }

  /**
   * @param {Uint8Array} rom
   */
  loadROM(rom) {
    this.memory.loadROM(rom);
    this.#init();
    this.memory.writeByte(0xFF01, 0x128); // TIMA
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