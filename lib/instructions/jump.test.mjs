// @ts-check
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { jp, jr } from './jump.mjs';
import { makeEmptyRegister } from '../../test/utils.mjs';

describe('jp', () => {
  let registers, memory;
  beforeEach(() => {
    registers = makeEmptyRegister();
    memory = new DataView(new ArrayBuffer(0x10000));
  });

  it('jumps to the specified address when operand is a16', () => {
    const instruction = /** @type {import('../types').Instruction} */ ({
      operands: [{ name: 'a16', value: 0x1234 }],
      cycles: [10, 12],
    });
    const cycles = jp(instruction, registers, memory);
    assert.strictEqual(registers.PC, 0x1234);
    assert.strictEqual(cycles, 10);
  });

  it('jumps to the specified address when operand is NZ and flagZero is false', () => {
    const instruction = /** @type {import('../types').Instruction} */ ({
      operands: [{ name: 'NZ' }, { name: 'a16', value: 0x1234 }],
      cycles: [10, 12],
    });
    registers.flagZero = false;
    assert.strictEqual(jp(instruction, registers, memory), 10);
    assert.strictEqual(registers.PC, 0x1234);
    registers.flagZero = true;
    registers.PC = 0
    assert.strictEqual(jp(instruction, registers, memory), 12);
    assert.strictEqual(registers.PC, 0);
  });
});

describe('jr', () => {
  let registers, memory;
  beforeEach(() => {
    registers = makeEmptyRegister();
    memory = new DataView(new ArrayBuffer(0x10000));
  });

  it('jumps to the specified address when operand is e8', () => {
    registers.PC = 0x01;
    const instruction = /** @type {import('../types').Instruction} */ ({
      operands: [{ name: 'e8', value: 0x12 }],
      cycles: [10, 12],
    });
    const cycles = jr(instruction, registers, memory);
    assert.strictEqual(registers.PC, 0x13);
    assert.strictEqual(cycles, 10);
  });

  it('jumps to the specified address when operand is NZ and flagZero is false', () => {
    registers.PC = 0x01;
    const instruction = /** @type {import('../types').Instruction} */ ({
      operands: [{ name: 'NZ' }, { name: 'e8', value: 0x12 }],
      cycles: [10, 12],
    });
    registers.flagZero = false;
    assert.strictEqual(jr(instruction, registers, memory), 10);
    assert.strictEqual(registers.PC, 0x13);
    registers.flagZero = true;
    registers.PC = 0;
    assert.strictEqual(jr(instruction, registers, memory), 12);
    assert.strictEqual(registers.PC, 0);
  });
});