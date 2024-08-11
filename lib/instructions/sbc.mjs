// @ts-check
import { getValueFromOperand } from "./_utils.mjs";

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
export function sbc(instruction, register, memory) {
  const value = getValueFromOperand(instruction.operands[1], register, memory);
  const result = register.A - value - +register.flagCarry;

  register.flagZero = result == 0;
  register.flagSubtract = true;
  register.flagCarry = result < 0;
  register.flagHalfCarry = ((register.A & 0x0F) - (value & 0x0F)) < 0;

  register.A = result & 0xFF;
}