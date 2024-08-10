// @ts-check
import { getValueFromArithmeticOperand, INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Operand} operand
 * @param {import("../types").Register} register
 * @param {Uint8Array} data
 */
function subA(operand, register, data) {
  const value = getValueFromArithmeticOperand(operand, register, data);
  const result = register.A - value;

  register.flagZero = result == 0;
  register.flagSubtract = true;
  register.flagCarry = result < 0;
  register.flagHalfCarry = ((register.A & 0x0F) - (value & 0x0F)) < 0;

  register.A = result & 0xFF;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {Uint8Array} data
 */
export function sub(instruction, register, data) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': subA(argument, register, data); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}