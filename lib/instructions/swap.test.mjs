// @ts-check
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { swap } from './swap.mjs';
import { makeData, makeEmptyRegister } from '../../test/utils.mjs';

describe('swap', () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  })

  it('swaps correctly', () => {
    register.A = 0xAB;
    const instruction = /** @type {import('../types').Instruction} */({ cycles: [1], operands: [{ name: 'A', immediate: true }] });
    swap(instruction, register, data);
    assert.strictEqual(register.A, 0xBA, `register.A not 0xBA, got 0x${register.A.toString(16)}`);
    assert.strictEqual(register.flagZero, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(register.flagCarry, false);
  })
})