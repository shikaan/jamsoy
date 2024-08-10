// @ts-check
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { and } from './and.mjs'
import { makeData, makeEmptyRegister } from "../../test/utils.mjs";
import { INVALID_INSTRUCTION_RETURN } from './_utils.mjs';

describe('and', () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  })

  it('performs bitwise AND correctly', () => {
    register.A = 0b10101010;
    register.B = 0b11001100;

    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = and(instruction, register, data);

    assert.strictEqual(register.A, 0b10001000);
    assert.strictEqual(register.flagZero, false);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, true);
    assert.strictEqual(result, 1);
  });

  it('sets zero flag when result is zero', () => {
    register.A = 0b10101010;
    register.B = 0b01010101;
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = and(instruction, register, data);

    assert.strictEqual(register.A, 0b00000000);
    assert.strictEqual(register.flagZero, true);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, true);
    assert.strictEqual(result, 1);
  });

  it('returns INVALID_INSTRUCTION_RETURN for unsupported destination', () => {
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'BC' }, { name: 'B' }] });
    const result = and(instruction, register, data);

    assert.strictEqual(result, INVALID_INSTRUCTION_RETURN);
  });
});