// @ts-check
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { add } from './add.mjs';
import { makeData, makeEmptyRegister } from '../../test/utils.mjs';

describe('add', () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  })

  describe('with 8-bit registers', () => {
    it('sums correctly', () => {
      register.B = 0x01
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
      add(instruction, register, data);
      assert.strictEqual(register.A, 0x01);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    })

    it('handles zero flag', () => {
      register.B = 0;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
      add(instruction, register, data);
      assert.strictEqual(register.A, 0x00, "result is incorrect");
      assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    })

    it('handles carry flag', () => {
      register.A = 0x10
      register.B = 0xFE;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
      add(instruction, register, data);
      assert.strictEqual(register.A, 0x0E);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    })

    it('handles half carry flag', () => {
      register.A = 1
      register.B = 0xF;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
      add(instruction, register, data);
      assert.strictEqual(register.A, 0x10);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, true, "flagHalfCarry is incorrect");
    })
  });

  describe('with 16-bit registers', () => {
    it('sums correctly', () => {
      register.HL = 0x0001
      register.BC = 0x0000
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'HL' }, { name: 'BC' }] });
      add(instruction, register, data);
      assert.strictEqual(register.HL, 0x0001);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    });

    it('handles zero flag', () => {
      register.BC = 0;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'HL' }, { name: 'BC' }] });
      add(instruction, register, data);
      assert.strictEqual(register.HL, 0x0000, "result is incorrect");
      assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    });

    it('handles carry flag', () => {
      register.HL = 0x8000;
      register.BC = 0x8001;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'HL' }, { name: 'BC' }] });
      add(instruction, register, data);
      assert.strictEqual(register.HL, 0x0001);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    });

    it('handles half carry flag', () => {
      register.HL = 0x0FFF;
      register.BC = 0x0001;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'HL' }, { name: 'BC' }] });
      add(instruction, register, data);
      assert.strictEqual(register.HL, 0x1000);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, true, "flagHalfCarry is incorrect");
    });
  });

  describe('with SP', () => {
    it('updates SP with positive values', () => {
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'SP', cycles: [1] }, { name: 'e8', value: 1 }] });
      add(instruction, register, data);
      assert.strictEqual(register.SP, 0x01);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    })

    it('updates SP with negative values', () => {
      register.SP = 0x00FF
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'SP' }, { name: 'e8', value: -0x01 }] });
      add(instruction, register, data);
      assert.strictEqual(register.SP, 0xFFFe);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, true);
      assert.strictEqual(register.flagHalfCarry, true);
    })
  });
})