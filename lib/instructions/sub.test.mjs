// @ts-check
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { sub } from './sub.mjs';

// Mock data and helper functions
const data = new Uint8Array(256).fill(0).map((_, index) => index); // Mock memory data
/**
 * @returns {import('../types').Register}
 */
const initialRegisterState = () => /** @type{import('../types').Register} */({
  A: 0x00,
  B: 0x00,
  HL: 0x0000,
  SP: 0x0000,
  flagZero: false,
  flagSubtract: false,
  flagCarry: false,
  flagHalfCarry: false
});

describe('sub', () => {
  describe('with 8-bit registers', () => {
    it('subtracts correctly', () => {
      const register = initialRegisterState();
      register.A = 0x02
      register.B = 0x01
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
      sub(instruction, register, data);
      assert.strictEqual(register.A, 0x01);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagSubtract, true);
      assert.strictEqual(register.flagHalfCarry, false);
    })

    it('handles zero flag', () => {
      const register = initialRegisterState();
      register.A = 0x01;
      register.B = 0x01;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
      sub(instruction, register, data);
      assert.strictEqual(register.A, 0x00, "result is incorrect");
      assert.strictEqual(register.flagSubtract, true);
      assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    })

    it('handles carry flag', () => {
      const register = initialRegisterState();
      register.A = 0x10;
      register.B = 0x20;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
      sub(instruction, register, data);
      assert.strictEqual(register.A, 0xF0);
      assert.strictEqual(register.flagSubtract, true, "flagSubtract is incorrect");
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    })

    it('handles half carry flag', () => {
      const register = initialRegisterState();
      register.A = 0x11;
      register.B = 0x02;
      const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
      sub(instruction, register, data);
      assert.strictEqual(register.A, 0x0F);
      assert.strictEqual(register.flagSubtract, true, "flagSubtract is incorrect");
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(register.flagHalfCarry, true, "flagHalfCarry is incorrect");
    })
  });
})