// @ts-check
import { GENERAL_PURPOSE } from "../registers.mjs";
import { getValueFromOperand, INVALID_INSTRUCTION_RETURN, setRegisterFromOperand } from "./_utils.mjs";

const ALLOWED_REGISTERS = GENERAL_PURPOSE.concat(["SP"]);

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
export function dec(instruction, register, memory) {
  const destination = instruction.operands[0];

  if (!ALLOWED_REGISTERS.includes(destination.name)) {
    return INVALID_INSTRUCTION_RETURN;
  }

  const initialValue = getValueFromOperand(destination, register, memory);
  const value = (initialValue - 1) & 0xFF;
  setRegisterFromOperand(destination, register, memory, value);

  register.flagZero = value === 0;
  register.flagSubtract = true;
  register.flagHalfCarry = ((initialValue & 0x0F) - 1) < 0;

  return instruction.cycles[0];
}