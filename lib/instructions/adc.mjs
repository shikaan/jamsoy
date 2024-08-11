// @ts-check
import { getValueFromOperand } from "./_utils.mjs";

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {Uint8Array} data
 */
export function adc(instruction, register, data) {
  const value = getValueFromOperand(instruction.operands[1], register, data);
  const result = register.A + value + +register.flagCarry;

  register.flagZero = result == 0;
  register.flagSubtract = false;
  register.flagCarry = result > 0xFF;
  register.flagHalfCarry = (register.A & 0x0F) + (value & 0x0F) > 0x0F;
  register.A = result & 0xFF;
}