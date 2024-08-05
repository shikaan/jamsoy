// @ts-check
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { register } from './registers.mjs'

describe('registers', () => {
  beforeEach(() => {
    register.reset();
  })

  describe('byte registers', () => {
    const HIGH_BYTE_REGS = ['A', 'B', 'D', 'H']
    const HIGH_BYTE_TO_WORD = { A: 'AF', B: 'BC', D: 'DE', H: 'HL' }
    const LOW_BYTE_REGS = ['C', 'E', 'F', 'L']
    const LOW_BYTE_TO_WORD = { F: 'AF', C: 'BC', E: 'DE', L: 'HL' }

    for (const r of HIGH_BYTE_REGS) {
      const word = HIGH_BYTE_TO_WORD[r]
      describe(r, () => {
        it('gets and sets correct values', () => {
          register[r] = 0x01;
          assert.deepEqual(register[r], 0x01);
          assert.deepEqual((register[word] >> 8), 0x01);
        })

        it('gets and sets out of bounds values', () => {
          register[r] = 0xFFF;
          assert.deepEqual(register[r], 0xFF);
          assert.deepEqual((register[word] >> 8), 0xFF);
          assert.deepEqual((register[word] & 0x0FF), 0x0);
        })
      })
    }

    for (const r of LOW_BYTE_REGS) {
      const word = LOW_BYTE_TO_WORD[r]
      describe(r, () => {
        it('gets and sets correct values', () => {
          register[r] = 0x01;
          assert.deepEqual(register[r], 0x01);
          assert.deepEqual((register[word] & 0x0FF), 0x01);
        })

        it('gets and sets out of bounds values', () => {
          register[r] = 0xFFF;
          assert.deepEqual(register[r], 0xFF);
          assert.deepEqual((register[word] & 0x0FF), 0xFF);
          assert.deepEqual((register[word] >> 8), 0x0);
        })
      })
    }
  })

  describe('word registers', () => {
    const WORD_REGS = ['SP', 'PC', 'AF', 'BC', 'DE', 'HL']
    const WORD_TO_BYTES = { SP: [], PC: [], AF: ['A', 'F'], BC: ['B', 'C'], DE: ['D', 'E'], HL: ['H', 'L'] }

    for (const r of WORD_REGS) {
      describe(r, () => {
        it('gets and sets correct values', () => {
          register[r] = 0xABCD;
          assert.deepEqual(register[r], 0xABCD);
          if (WORD_TO_BYTES[r].length > 0) {
            assert.deepEqual((register[WORD_TO_BYTES[r][0]]), 0xAB);
            assert.deepEqual((register[WORD_TO_BYTES[r][1]]), 0xCD);
          }
        })

        it('gets and sets out of bounds values', () => {
          register[r] = 0xFFFFF;
          assert.deepEqual(register[r], 0xFFFF);
          if (WORD_TO_BYTES[r].length > 0) {
            assert.deepEqual((register[WORD_TO_BYTES[r][0]]), 0xFF);
            assert.deepEqual((register[WORD_TO_BYTES[r][1]]), 0xFF);
          }
        })
      })
    }
  })

  describe('flags', () => {
    const FLAGS = ['flagCarry', 'flagHalfCarry', 'flagSubtract', 'flagZero']
    const EXPECTED_F = [0b00010000, 0b00100000, 0b01000000, 0b10000000]

    for (const [i, f] of Object.entries(FLAGS)) {
      describe(f, () => {
        it('sets the flag', () => {
          register[f] = true
          assert.deepStrictEqual(register.F, EXPECTED_F[i]);
          register[f] = false
          assert.deepStrictEqual(register.F, 0);
        })
      })
    }
  })
})