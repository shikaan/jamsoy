// @ts-check
import { Memory } from "../lib/memory.mjs";
import { CPU } from "../lib/cpu/cpu.mjs";
import { Timer } from "../lib/timer.mjs";
import { register } from "../lib/cpu/registers.mjs";
import { Interrupts } from "../lib/interrupts.mjs";
import { Graphics } from "../lib/graphics.mjs";

class GameBoy {
  constructor(screen) {
    this.memory = new Memory();
    this.register = register;
    this.interrupts = new Interrupts(this.memory, register);
    this.cpu = new CPU(this.memory, register, this.interrupts);
    this.timer = new Timer(this.memory, this.interrupts);
    this.screen = screen
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

  instructions = 0;

  update() {
    let cycles = 0;
    while (cycles < CPU.MAX_CYCLES) {
      this.interrupts.handleInterrupts();
      cycles += this.cpu.executeNextIntruction(false);
      this.instructions++;
      this.timer.update(cycles);
      this.graphics.update(cycles);
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