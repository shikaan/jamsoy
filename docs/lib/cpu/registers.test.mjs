// @ts-check
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { CPURegisters } from "./registers.mjs";

describe("registers", () => {
  let registers;
  beforeEach(() => {
    registers = new CPURegisters();
  });

  describe("byte registers", () => {
    const HIGH_BYTE_REGS = ["A", "B", "D", "H"];
    const HIGH_BYTE_TO_WORD = { A: "AF", B: "BC", D: "DE", H: "HL" };
    const LOW_BYTE_REGS = ["C", "E", "L"];
    const LOW_BYTE_TO_WORD = { C: "BC", E: "DE", L: "HL" };

    for (const r of HIGH_BYTE_REGS) {
      const word = HIGH_BYTE_TO_WORD[r];
      describe(r, () => {
        it("gets and sets correct values", () => {
          registers[r] = 0x01;
          assert.deepEqual(registers[r], 0x01);
          assert.deepEqual(registers[word] >> 8, 0x01);
        });

        it("gets and sets out of bounds values", () => {
          registers[r] = 0xfff;
          assert.deepEqual(registers[r], 0xff);
          assert.deepEqual(registers[word] >> 8, 0xff);
          assert.deepEqual(registers[word] & 0x0ff, 0x0);
        });
      });
    }

    for (const r of LOW_BYTE_REGS) {
      const word = LOW_BYTE_TO_WORD[r];
      describe(r, () => {
        it("gets and sets correct values", () => {
          registers[r] = 0x01;
          assert.deepEqual(registers[r], 0x01);
          assert.deepEqual(registers[word] & 0x0ff, 0x01);
        });

        it("gets and sets out of bounds values", () => {
          registers[r] = 0xfff;
          assert.deepEqual(registers[r], 0xff);
          assert.deepEqual(registers[word] & 0x0ff, 0xff);
          assert.deepEqual(registers[word] >> 8, 0x0);
        });
      });
    }
  });

  describe("word registers", () => {
    const WORD_REGS = ["SP", "PC", "BC", "DE", "HL"];
    const WORD_TO_BYTES = {
      SP: [],
      PC: [],
      BC: ["B", "C"],
      DE: ["D", "E"],
      HL: ["H", "L"],
    };

    for (const r of WORD_REGS) {
      describe(r, () => {
        it("gets and sets correct values", () => {
          registers[r] = 0xabcd;
          assert.deepEqual(registers[r], 0xabcd, `${r} does not match`);
          if (WORD_TO_BYTES[r].length > 0) {
            assert.deepEqual(
              registers[WORD_TO_BYTES[r][0]],
              0xab,
              `${r} lower nibble does not match`,
            );
            assert.deepEqual(
              registers[WORD_TO_BYTES[r][1]],
              0xcd,
              `${r} upper nibble does not match`,
            );
          }
        });

        it("gets and sets out of bounds values", () => {
          registers[r] = 0xfffff;
          assert.deepEqual(registers[r], 0xffff);
          if (WORD_TO_BYTES[r].length > 0) {
            assert.deepEqual(registers[WORD_TO_BYTES[r][0]], 0xff);
            assert.deepEqual(registers[WORD_TO_BYTES[r][1]], 0xff);
          }
        });
      });
    }

    describe("AF", () => {
      it("gets and sets correct values", () => {
        registers.AF = 0xab10;
        assert.deepEqual(
          registers.AF,
          0xab10,
          `0x${registers.AF.toString(16)} does not match`,
        );
        assert.deepEqual(registers.A, 0xab);
        assert.deepEqual(registers.F, 0x10);
      });

      it("gets and sets out of bounds values", () => {
        registers.AF = 0xfffff;
        assert.deepEqual(registers.AF, 0xfff0);
        assert.deepEqual(registers.A, 0xff);
        assert.deepEqual(registers.F, 0xf0);
      });
    });
  });

  describe("flags", () => {
    const FLAGS = ["flagCarry", "flagHalfCarry", "flagSubtract", "flagZero"];
    const EXPECTED_F = [0b00010000, 0b00100000, 0b01000000, 0b10000000];

    for (const [i, f] of Object.entries(FLAGS)) {
      describe(f, () => {
        it("sets the flag", () => {
          registers[f] = true;
          assert.deepStrictEqual(registers.F, EXPECTED_F[i]);
          registers[f] = false;
          assert.deepStrictEqual(registers.F, 0);
        });
      });
    }
  });
});
