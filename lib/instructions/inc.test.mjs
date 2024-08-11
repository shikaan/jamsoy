// @ts-check
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { inc } from './inc.mjs';
import { makeData, makeEmptyRegister } from '../../test/utils.mjs';

describe('inc', () => {
  const instruction = /** @type {import('../types').Instruction} */({
    operands: [{ name: 'A', immediate: true }],
    cycles: [4],
  });

  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  })

  it('increments the value in the register', () => {
    register.A = 0x01;
    const cycles = inc(instruction, register, data);
    assert.strictEqual(register.A, 0x02);
    assert.strictEqual(cycles, 4);
  });

  it('sets the zero flag when the result is zero', () => {
    register.A = 0xFF;
    inc(instruction, register, data);
    assert.strictEqual(register.flagZero, true);
  });

  it('resets the subtract flag', () => {
    register.flagSubtract = true;
    inc(instruction, register, data);
    assert.strictEqual(register.flagSubtract, false);
  });

  it('sets the half carry flag when the lower nibble overflows', () => {
    register.A = 0x0F;
    inc(instruction, register, data);
    assert.strictEqual(register.flagHalfCarry, true);
  });

  it('handles non-immediate operands', () => {
    const instruction = /** @type {import('../types').Instruction} */({
      operands: [{ name: 'HL', immediate: false }],
      cycles: [12],
    });

    register.HL = 0x10;
    data[register.HL] = 0x01;

    const cycles = inc(instruction, register, data);
    assert.strictEqual(data[register.HL], 0x02);
    assert.strictEqual(cycles, 12);
  });
});
