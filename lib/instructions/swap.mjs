// @ts-check
import { getValueFromOperand, setRegisterFromOperand } from "./_utils.mjs";

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
export function swap(instruction, register, memory) {
  const [operand] = instruction.operands;
  const value = getValueFromOperand(operand, register, memory);
  const result = ((value & 0x0f) << 4) | ((value & 0xf0) >> 4);
  register.flagZero = result == 0;
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagCarry = false;
  setRegisterFromOperand(operand, register, memory, result);
  return instruction.cycles[0];
}
