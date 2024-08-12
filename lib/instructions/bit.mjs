// @ts-check

import { getValueFromOperand, setRegisterFromOperand } from "./_utils.mjs";

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function bit(instruction, register, memory) {
  const [argument, operand] = instruction.operands;
  const bit = Number.parseInt(argument.name, 10);
  const value = getValueFromOperand(operand, register, memory);
  const result = value & (1 << bit); // this is zero only if the bit is zero
  register.flagZero = result === 0;
  register.flagSubtract = false;
  register.flagHalfCarry = true;
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function set(instruction, register, memory) {
  const [argument, operand] = instruction.operands;
  const bit = Number.parseInt(argument.name, 10);
  const value = getValueFromOperand(operand, register, memory);
  setRegisterFromOperand(operand, register, memory, value | (1 << bit));
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function res(instruction, register, memory) {
  const [argument, operand] = instruction.operands;
  const bit = Number.parseInt(argument.name, 10);
  const value = getValueFromOperand(operand, register, memory);
  setRegisterFromOperand(operand, register, memory, value & ~(1 << bit));
  return instruction.cycles[0];
}

export { bit, set, res };
