// @ts-check
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { or } from './or.mjs'
import { makeData, makeEmptyRegister } from "../../test/utils.mjs";
import { INVALID_INSTRUCTION_RETURN } from './_utils.mjs';

describe('or', () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  })

  it('performs bitwise or correctly', () => {
    register.A = 0b10101010;
    register.B = 0b11001100;

    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = or(instruction, register, data);

    assert.strictEqual(register.A, 0b11101110);
    assert.strictEqual(register.flagZero, false);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(result, 1);
  });

  it('sets zero flag when result is zero', () => {
    register.A = 0b00000000;
    register.B = 0b00000000;
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = or(instruction, register, data);

    assert.strictEqual(register.A, 0b00000000);
    assert.strictEqual(register.flagZero, true);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(result, 1);
  });

  it('returns INVALID_INSTRUCTION_RETURN for unsupported destination', () => {
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'BC' }, { name: 'B' }] });
    const result = or(instruction, register, data);

    assert.strictEqual(result, INVALID_INSTRUCTION_RETURN);
  });
});