// @ts-check
import { getValueFromOperand, IMMEDIATE_REGISTERS, INVALID_INSTRUCTION_RETURN, setRegisterFromOperand } from "./_utils.mjs";

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 * @param {Uint8Array} data 
 */
export function inc(instruction, register, data) {
  const destination = instruction.operands[0];

  if (!IMMEDIATE_REGISTERS.includes(destination.name)) {
    return INVALID_INSTRUCTION_RETURN;
  }

  const initialValue = getValueFromOperand(destination, register, data);
  const value = (initialValue + 1) & 0xFF;
  setRegisterFromOperand(destination, register, data, value);

  register.flagZero = value === 0;
  register.flagSubtract = false;
  register.flagHalfCarry = ((initialValue & 0x0F) + 1) > 0x0F;

  return instruction.cycles[0];
}