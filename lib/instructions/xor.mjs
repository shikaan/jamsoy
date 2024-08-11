// @ts-check
import { getValueFromOperand, INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Operand} argument 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function xorA(argument, register, memory) {
  const value = getValueFromOperand(argument, register, memory);
  const result = register.A ^ value;
  register.flagCarry = false;
  register.flagHalfCarry = false;
  register.flagZero = result === 0;
  register.flagSubtract = false;
  register.A = result;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
export function xor(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': xorA(argument, register, memory); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}