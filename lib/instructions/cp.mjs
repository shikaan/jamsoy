// @ts-check

import { getValueFromOperand, INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function cpA(operand, register, memory) {
  const value = getValueFromOperand(operand, register, memory);
  const result = register.A - value;

  register.flagZero = result == 0;
  register.flagSubtract = true;
  register.flagCarry = result < 0;
  register.flagHalfCarry = ((register.A & 0x0F) - (value & 0x0F)) < 0;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
export function cp(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': cpA(argument, register, memory); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}