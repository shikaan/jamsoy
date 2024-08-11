// @ts-check
import { getValueFromOperand, INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Operand} argument 
 * @param {import("../types").Register} register 
 * @param {Uint8Array} data 
 */
function orA(argument, register, data) {
  const value = getValueFromOperand(argument, register, data);
  const result = register.A | value;
  register.flagCarry = false;
  register.flagHalfCarry = false;
  register.flagZero = result === 0;
  register.flagSubtract = false;
  register.A = result;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {Uint8Array} data
 */
export function or(instruction, register, data) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': orA(argument, register, data); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}