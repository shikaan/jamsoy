// @ts-check
import { GENERAL_PURPOSE } from "../registers.mjs";
import { getValueFromOperand, INVALID_INSTRUCTION_RETURN, setRegisterFromOperand } from "./_utils.mjs";

const ALLOWED_REGISTERS = GENERAL_PURPOSE.concat(["SP"]);
/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
export function inc(instruction, register, memory) {
  const destination = instruction.operands[0];

  if (!ALLOWED_REGISTERS.includes(destination.name)) {
    return INVALID_INSTRUCTION_RETURN;
  }

  const initialValue = getValueFromOperand(destination, register, memory);
  const value = (initialValue + 1) & 0xFF;
  setRegisterFromOperand(destination, register, memory, value);

  register.flagZero = value === 0;
  register.flagSubtract = false;
  register.flagHalfCarry = ((initialValue & 0x0F) + 1) > 0x0F;

  return instruction.cycles[0];
}