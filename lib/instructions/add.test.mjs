// @ts-check
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { add } from './add.mjs';

// Mock data and helper functions
const data = new Uint8Array(256).fill(0).map((_, index) => index); // Mock memory data
const initialRegisterState = () => ({
  A: 0x00,
  B: 0x00,
  HL: 0x0000,
  SP: 0x0000,
  flagZero: false,
  flagSubtract: false,
  flagCarry: false,
  flagHalfCarry: false
});

describe('add', () => {
  describe('with 8-bit registers', () => {
    it('sums correctly', () => {
      const register = initialRegisterState();
      register.B = 0x01
      add({ operands: [{ name: 'A' }, { name: 'B' }] }, register, data);
      assert.strictEqual(register.A, 0x01);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    })

    it('handles zero flag', () => {
      const register = initialRegisterState();
      register.B = 0;
      add({ operands: [{ name: 'A' }, { name: 'B' }] }, register, data);
      assert.strictEqual(register.A, 0x00, "result is incorrect");
      assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    })

    it('handles carry flag', () => {
      const register = initialRegisterState();
      register.A = 0x10
      register.B = 0xFE;
      add({ operands: [{ name: 'A' }, { name: 'B' }] }, register, data);
      assert.strictEqual(register.A, 0x0E);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    })

    it('handles half carry flag', () => {
      const register = initialRegisterState();
      register.A = 1
      register.B = 0xF;
      add({ operands: [{ name: 'A' }, { name: 'B' }] }, register, data);
      assert.strictEqual(register.A, 0x10);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, true, "flagHalfCarry is incorrect");
    })
  });

  describe('with 16-bit registers', () => {
    it('sums correctly', () => {
      const register = initialRegisterState();
      register.HL = 0x0001
      register.BC = 0x0000
      add({ operands: [{ name: 'HL' }, { name: 'BC' }] }, register, data);
      assert.strictEqual(register.HL, 0x0001);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    });

    it('handles zero flag', () => {
      const register = initialRegisterState();
      register.BC = 0;
      add({ operands: [{ name: 'HL' }, { name: 'BC' }] }, register, data);
      assert.strictEqual(register.HL, 0x0000, "result is incorrect");
      assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    });

    it('handles carry flag', () => {
      const register = initialRegisterState();
      register.HL = 0x8000;
      register.BC = 0x8001;
      add({ operands: [{ name: 'HL' }, { name: 'BC' }] }, register, data);
      assert.strictEqual(register.HL, 0x0001);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    });

    it('handles half carry flag', () => {
      const register = initialRegisterState();
      register.HL = 0x0FFF;
      register.BC = 0x0001;
      add({ operands: [{ name: 'HL' }, { name: 'BC' }] }, register, data);
      assert.strictEqual(register.HL, 0x1000);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, true, "flagHalfCarry is incorrect");
    });
  });

  describe('with SP', () => {
    it('updates SP with positive values', () => {
      const register = initialRegisterState()
      add({ operands: [{ name: 'SP' }, { name: 'e8', value: 1 }] }, register, data);
      assert.strictEqual(register.SP, 0x01);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    })

    it('updates SP with negative values', () => {
      const register = initialRegisterState()
      register.SP = 0x00FF
      add({ operands: [{ name: 'SP' }, { name: 'e8', value: -0x01 }] }, register, data);
      assert.strictEqual(register.SP, 0xFFFe);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, true);
      assert.strictEqual(register.flagHalfCarry, true);
    })
  });
})