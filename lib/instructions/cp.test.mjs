// @ts-check
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { cp } from './cp.mjs'
import { makeData, makeEmptyRegister } from "../../test/utils.mjs";
import { INVALID_INSTRUCTION_RETURN } from './_utils.mjs';

describe('cp', () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  })

  it('performs subtraction correctly', () => {
    register.A = 0x11;
    register.B = 0x01;

    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = cp(instruction, register, data);

    assert.strictEqual(register.A, 0x11, "A should not be modified");
    assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
    assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
    assert.strictEqual(register.flagSubtract, true, "flagSubtract is incorrect");
    assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    assert.strictEqual(result, 1);
  });

  it('sets zero flag when result is zero', () => {
    register.A = 0x10;
    register.B = 0x10;
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = cp(instruction, register, data);

    assert.strictEqual(register.A, 0x10, "A should not be modified");
    assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
    assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
    assert.strictEqual(register.flagSubtract, true, "flagSubtract is incorrect");
    assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    assert.strictEqual(result, 1);
  });

  it('sets carry flag when result is negative', () => {
    register.A = 0x10;
    register.B = 0x20;
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = cp(instruction, register, data);

    assert.strictEqual(register.A, 0x10, "A should not be modified");
    assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
    assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
    assert.strictEqual(register.flagSubtract, true, "flagSubtract is incorrect");
    assert.strictEqual(register.flagHalfCarry, false, "flagHalfCarry is incorrect");
    assert.strictEqual(result, 1);
  });

  it('sets half carry flag when there is a borrow from bit 4', () => {
    register.A = 0x10;
    register.B = 0x01;
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A' }, { name: 'B' }] });
    const result = cp(instruction, register, data);

    assert.strictEqual(register.A, 0x10, "A should not be modified");
    assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
    assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
    assert.strictEqual(register.flagSubtract, true, "flagSubtract is incorrect");
    assert.strictEqual(register.flagHalfCarry, true, "flagHalfCarry is incorrect");
    assert.strictEqual(result, 1);
  });

  it('returns INVALID_INSTRUCTION_RETURN for unsupported destination', () => {
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'BC' }, { name: 'B' }] });
    const result = cp(instruction, register, data);

    assert.strictEqual(result, INVALID_INSTRUCTION_RETURN);
  });
});