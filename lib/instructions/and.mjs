// @ts-check
import { getValueFromOperand, INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Operand} argument 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function andA(argument, register, memory) {
  const value = getValueFromOperand(argument, register, memory);
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
 * @param {import("../types").Memory} memory
 */
export function and(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': andA(argument, register, memory); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}