// @ts-check
import { readByteFromOperand, writeByteFromOperand } from "./_utils.mjs";

/**
 * @param {import("../../types").Instruction} instruction
 * @param {import("../../types").Register} register
 * @param {import("../../types").Memory} memory
 */
export function rlc(instruction, register, memory) {
  const value = readByteFromOperand(instruction.operands[0], register, memory);
  const carry = value >> 7;
  writeByteFromOperand(
    instruction.operands[0],
    register,
    memory,
    ((value << 1) & 0xff) | carry,
  );
  register.flagCarry = !!carry;
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagZero = value === 0;
  return instruction.cycles[0];
}

/**
 * @param {import("../../types").Instruction} instruction
 * @param {import("../../types").Register} register
 * @param {import("../../types").Memory} memory
 */
export function rl(instruction, register, memory) {
  const value = readByteFromOperand(instruction.operands[0], register, memory);
  const carry = value >> 7;
  writeByteFromOperand(
    instruction.operands[0],
    register,
    memory,
    ((value << 1) & 0xff) | +register.flagCarry,
  );
  register.flagCarry = !!carry;
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagZero = value === 0;
  return instruction.cycles[0];
}

/**
 * @param {import("../../types").Instruction} instruction
 * @param {import("../../types").Register} register
 * @param {import("../../types").Memory} memory
 */
export function rrc(instruction, register, memory) {
  const value = readByteFromOperand(instruction.operands[0], register, memory);
  const carry = value & 1;
  writeByteFromOperand(
    instruction.operands[0],
    register,
    memory,
    (value >> 1) | (carry << 7),
  );
  register.flagCarry = !!carry;
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagZero = value === 0;
  return instruction.cycles[0];
}

/**
 * @param {import("../../types").Instruction} instruction
 * @param {import("../../types").Register} register
 * @param {import("../../types").Memory} memory
 */
export function rr(instruction, register, memory) {
  const value = readByteFromOperand(instruction.operands[0], register, memory);
  const carry = value & 1;
  writeByteFromOperand(
    instruction.operands[0],
    register,
    memory,
    (value >> 1) | (+register.flagCarry << 7),
  );
  register.flagCarry = !!carry;
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagZero = value === 0;
  return instruction.cycles[0];
}
