// @ts-check
import { describe, it } from "node:test";
import assert from "node:assert";
import { CPU } from "./cpu.mjs";
import { Memory } from "../memory.mjs";
import { Input } from "../input.mjs";
import { Interrupts } from "../interrupts.mjs";
import { CPURegisters } from "./registers.mjs";

const register = new CPURegisters();

const prefixTiming = [
  2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2,
  2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2,
  2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2,
  3, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
  2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2,
  2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2,
  2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2,
  4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
  2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2,
  2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
];

const timings = [
  1, 3, 2, 2, 1, 1, 2, 1, 5, 2, 2, 2, 1, 1, 2, 1, 0, 3, 2, 2, 1, 1, 2, 1, 3, 2,
  2, 2, 1, 1, 2, 1, 2, 3, 2, 2, 1, 1, 2, 1, 2, 2, 2, 2, 1, 1, 2, 1, 2, 3, 2, 2,
  3, 3, 3, 1, 2, 2, 2, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
  2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
  1, 1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 0, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1,
  1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1,
  1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
  2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 3, 3, 4, 3, 4, 2, 4, 2, 4, 3, 0, 3, 6, 2, 4,
  2, 3, 3, 0, 3, 4, 2, 4, 2, 4, 3, 0, 3, 0, 2, 4, 3, 3, 2, 0, 0, 4, 2, 4, 4, 1,
  4, 0, 0, 0, 2, 4, 3, 3, 2, 1, 0, 4, 2, 4, 3, 2, 4, 1, 0, 0, 2, 4,
];

describe("CPU", () => {
  describe("timing", () => {
    it("unprefixed", () => {
      const illegal = [
        0xcb, 0xe4, 0xd3, 0xdb, 0xdd, 0xe3, 0xeb, 0xec, 0xed, 0xf4, 0xfc, 0xfd,
      ];
      for (let i = 0; i < 256; i++) {
        if (illegal.includes(i)) continue;
        const cpu = createCPUWithInstruction(i, false);
        const cycles = cpu.executeNextIntruction();
        assert.equal(
          cycles,
          timings[i] * 4,
          `Instruction 0x${i.toString(16)} took ${cycles} cycles, expected ${timings[i] * 4}`,
        );
      }
    });

    it("prefixed", () => {
      for (let i = 0; i < 256; i++) {
        const cpu = createCPUWithInstruction(i, true);
        const cycles = cpu.executeNextIntruction();
        assert.equal(
          cycles,
          prefixTiming[i] * 4,
          `Instruction 0x${i.toString(16)} took ${cycles} cycles, expected ${prefixTiming[i] * 4}`,
        );
      }
    });
  });
});

const prep = {
  0x28: () => {
    register.flagZero = false;
  },
  0x30: () => {
    register.flagCarry = true;
  },
  0xd0: () => {
    register.flagCarry = true;
  },
  0xd2: () => {
    register.flagCarry = true;
  },
  0xd4: () => {
    register.flagCarry = true;
  },
  0xc8: () => {
    register.flagZero = false;
  },
  0xca: () => {
    register.flagZero = false;
  },
  0xcc: () => {
    register.flagZero = false;
  },
  0x38: () => {
    register.flagCarry = false;
  },
  0xd8: () => {
    register.flagCarry = false;
  },
  0xda: () => {
    register.flagCarry = false;
  },
  0xdc: () => {
    register.flagCarry = false;
  },
};

function createCPUWithInstruction(instruction, prefix) {
  register.initialize();
  const input = new Input();
  const memory = new Memory(input);
  const interrupts = new Interrupts(memory, register);
  const cpu = new CPU(memory, register, interrupts);
  cpu.initialize();
  prep[instruction]?.();
  const rom = new Uint8Array(0x8000);
  if (prefix) {
    rom[0x100] = 0xcb;
    rom[0x101] = instruction;
  } else {
    rom[0x100] = instruction;
  }
  memory.loadROM(rom);
  return cpu;
}
