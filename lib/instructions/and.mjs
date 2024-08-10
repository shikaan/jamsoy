// @ts-check
import { getValueFromArithmeticOperand, INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Operand} argument 
 * @param {import("../types").Register} register 
 * @param {Uint8Array} data 
 */
function andA(argument, register, data) {
  const value = getValueFromArithmeticOperand(argument, register, data);
  const result = register.A & value;
  register.flagCarry = false;
  register.flagHalfCarry = true;
  register.flagZero = result === 0;
  register.flagSubtract = false;
  register.A = result;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {Uint8Array} data
 */
export function and(instruction, register, data) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': andA(argument, register, data); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}