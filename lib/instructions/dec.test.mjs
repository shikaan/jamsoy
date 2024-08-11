// @ts-check
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { dec } from './dec.mjs';
import { makeData, makeEmptyRegister } from '../../test/utils.mjs';

describe('dec', () => {
  const instruction = /** @type {import('../types').Instruction} */({
    operands: [{ name: 'A', immediate: true }],
    cycles: [4],
  });

  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  })

  it('decrements the value in the register', () => {
    register.A = 0x01;
    const cycles = dec(instruction, register, data);
    assert.strictEqual(register.A, 0x00);
    assert.strictEqual(cycles, 4);
  });

  it('sets the zero flag when the result is zero', () => {
    register.A = 0x01;
    dec(instruction, register, data);
    assert.strictEqual(register.flagZero, true);
  });

  it('sets the subtract flag', () => {
    register.flagSubtract = false;
    dec(instruction, register, data);
    assert.strictEqual(register.flagSubtract, true);
  });

  it('sets the half carry flag when there is borrow from bit 4', () => {
    register.A = 0x10;
    dec(instruction, register, data);
    assert.strictEqual(register.flagHalfCarry, true);
  });

  it('handles non-immediate operands', () => {
    const instruction = /** @type {import('../types').Instruction} */({
      operands: [{ name: 'HL', immediate: false }],
      cycles: [12],
    });

    register.HL = 0x10;
    data.setUint8(register.HL, 0x01);

    const cycles = dec(instruction, register, data);
    assert.strictEqual(data.getUint8(register.HL), 0x00);
    assert.strictEqual(cycles, 12);
  });
});
