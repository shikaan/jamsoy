// @ts-check
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { register } from './registers.mjs'

describe('registers', () => {
  beforeEach(() => {
    register.reset();
  })

  describe('byte registers', () => {
    const HIGH_BYTE_REGS = ['a', 'b', 'd', 'h']
    const HIGH_BYTE_TO_WORD = { a: 'af', b: 'bc', d: 'de', h: 'hl' }
    const LOW_BYTE_REGS = ['c', 'e', 'f', 'l']
    const LOW_BYTE_TO_WORD = { f: 'af', c: 'bc', e: 'de', l: 'hl' }

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
    const WORD_REGS = ['sp', 'pc', 'af', 'bc', 'de', 'hl']
    const WORD_TO_BYTES = { sp: [], pc: [], af: ['a', 'f'], bc: ['b', 'c'], de: ['d', 'e'], hl: ['h', 'l'] }

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
    const FLAGS = ['flagC', 'flagH', 'flagN', 'flagZ']
    const EXPECTED_F = [0b00010000, 0b00100000, 0b01000000, 0b10000000]

    for (const [i, f] of Object.entries(FLAGS)) {
      describe(f, () => {
        it('sets the flag', () => {
          register[f] = 1
          assert.deepStrictEqual(register.f, EXPECTED_F[i]);
          register[f] = 0
          assert.deepStrictEqual(register.f, 0);
        })
      })
    }
  })
})