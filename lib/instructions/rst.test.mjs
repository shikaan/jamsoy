import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { rst } from './rst.mjs';
import { makeEmptyRegister } from '../../test/utils.mjs';

describe('rst', () => {
  let registers, memory;
  beforeEach(() => {
    registers = makeEmptyRegister();
    memory = new DataView(new ArrayBuffer(0x10000));
  });

  it('sets the PC to the specified address and updates SP', () => {
    registers.PC = 0x1234;
    registers.SP = 0x1000;
    const instruction = /** @type {import('../types').Instruction} */ ({
      operands: [{ name: '$08' }],
      cycles: [16],
    });
    const cycles = rst(instruction, registers, memory);
    assert.strictEqual(registers.PC, 0x08);
    assert.strictEqual(registers.SP, 0x0FFE);
    assert.strictEqual(cycles, 16);
  });

  it('sets the PC to the specified address and updates SP for different RST addresses', () => {
    registers.PC = 0x5678;
    registers.SP = 0x2000;
    const instruction = /** @type {import('../types').Instruction} */ ({
      operands: [{ name: '$10' }],
      cycles: [16],
    });
    const cycles = rst(instruction, registers, memory);
    assert.strictEqual(registers.PC, 0x10);
    assert.strictEqual(registers.SP, 0x1FFE);
    assert.strictEqual(cycles, 16);

    registers.PC = 0xABCD;
    registers.SP = 0x3000;
    instruction.operands[0].name = '$18';
    const cycles2 = rst(instruction, registers, memory);
    assert.strictEqual(registers.PC, 0x18);
    assert.strictEqual(registers.SP, 0x2FFE);
    assert.strictEqual(cycles2, 16);
  });
});