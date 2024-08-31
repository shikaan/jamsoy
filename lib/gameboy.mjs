// @ts-check
import { Memory } from "./memory.mjs";
import { CPU } from "./cpu/cpu.mjs";
import { Timer } from "./timer.mjs";
import { CPURegisters } from "./cpu/registers.mjs";
import { Interrupts } from "./interrupts.mjs";
import { PPU } from "./gfx/ppu.mjs";

class GameBoy {
  buffer = "";

  /**
   * @param {import("./types").Screen} screen
   * @param {import("./types").Input} input
   */
  constructor(screen, input) {
    this.input = input;
    this.memory = new Memory(input);
    this.registers = new CPURegisters();
    this.interrupts = new Interrupts(this.memory, this.registers);
    this.cpu = new CPU(
      this.memory,
      this.registers,
      this.interrupts,
    );
    this.timer = new Timer(this.memory, this.interrupts);
    this.graphics = new PPU(this.memory, this.interrupts, screen);
  }

  /**
   * @param {Uint8Array} rom
   */
  loadROM(rom) {
    this.#init();
    this.buffer = "";
    this.memory.loadROM(rom);
  }

  update() {
    let tCyclesThisFrame = 0;
    while (tCyclesThisFrame < CPU.CYCLES_PER_FRAME) {
      const tCycles = this.cpu.executeNextIntruction();
      tCyclesThisFrame += tCycles;
      this.interrupts.handleInterrupts();
      this.timer.update(tCycles);
      this.graphics.update(tCycles);
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
