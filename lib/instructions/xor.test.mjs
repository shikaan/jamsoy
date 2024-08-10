// @ts-check
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { xor } from './xor.mjs'
import { makeData, makeEmptyRegister } from "../../test/utils.mjs";
import { INVALID_INSTRUCTION_RETURN } from './_utils.mjs';

describe('xor', () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  })

  it('performs bitwise xor correctly', () => {
    register.A = 0b10101010;
    register.B = 0b11001100;

    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = xor(instruction, register, data);

    assert.strictEqual(register.A, 0b01100110);
    assert.strictEqual(register.flagZero, false);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(result, 1);
  });

  it('sets zero flag when result is zero', () => {
    register.A = 0b11111111;
    register.B = 0b11111111;
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = xor(instruction, register, data);

    assert.strictEqual(register.A, 0b00000000);
    assert.strictEqual(register.flagZero, true);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(result, 1);
  });

  it('returns INVALID_INSTRUCTION_RETURN for unsupported destination', () => {
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'BC' }, { name: 'B' }] });
    const result = xor(instruction, register, data);

    assert.strictEqual(result, INVALID_INSTRUCTION_RETURN);
  });
});