// @ts-check
import { Memory } from "../lib/memory.mjs";
import { CPU } from "../lib/cpu/cpu.mjs";
import { Timer } from "../lib/timer.mjs";
import { register } from "../lib/cpu/registers.mjs";
import { Interrupts } from "../lib/interrupts.mjs";
import { Graphics } from "../lib/graphics.mjs";

class GameBoy {
  buffer = '';
  input;

  constructor(screen, input) {
    this.input = input;
    this.memory = new Memory(input);
    this.register = register;
    this.interrupts = new Interrupts(this.memory, register);
    this.cpu = new CPU(this.memory, register, this.interrupts);
    this.timer = new Timer(this.memory, this.interrupts);
    this.graphics = new Graphics(this.memory, this.interrupts, screen);

    this.memory.onSerial((char) => {
      if (char === '\n') {
        console.log(this.buffer);
        this.buffer = '';
      } else {
        this.buffer += char;
      }
    })
  }

  /**
   * @param {Uint8Array} rom
   */
  loadROM(rom) {
    this.#init();
    this.buffer = '';
    this.memory.loadROM(rom);
  }

  instructions = 0;

  update() {
    let cycles = 0;
    while (cycles < CPU.MAX_CYCLES) {
      cycles += this.cpu.executeNextIntruction(false);
      // this.instructions++;
      this.interrupts.handleInterrupts();
      this.timer.update(cycles);
      this.graphics.update(cycles);
    }
  }

  #init() {
    this.memory.initialize();
    this.cpu.initialize();
    this.timer.initialize();
    this.input.initialize();
  }
}

export { GameBoy };
