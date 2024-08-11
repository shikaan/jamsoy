// @ts-check
import { getValueFromOperand, setRegisterFromOperand } from "./_utils.mjs";

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 * @returns {number}
 */
export function sla(instruction, register, memory) {
  const value = getValueFromOperand(instruction.operands[0], register, memory) << 1;
  setRegisterFromOperand(instruction.operands[0], register, memory, value & 0xFF);
  register.flagZero = value === 0;
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagCarry = value > 0xFF;
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 * @returns {number}
 */
export function sra(instruction, register, memory) {
  const value = getValueFromOperand(instruction.operands[0], register, memory);
  const result = (value >> 1) + (value & 0x80) + ((value & 1) << 8);
  setRegisterFromOperand(instruction.operands[0], register, memory, result);
  register.flagZero = (result & 0xFF) === 0;
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagCarry = result > 0xFF;
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 * @returns {number}
 */
export function srl(instruction, register, memory) {
  const value = getValueFromOperand(instruction.operands[0], register, memory);
  const result = (value >> 1) + ((value & 1) << 8);
  setRegisterFromOperand(instruction.operands[0], register, memory, result);
  register.flagZero = (result & 0xFF) === 0;
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagCarry = result > 0xFF;
  return instruction.cycles[0];
}