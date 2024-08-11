/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 */
export function daa(instruction, register) {
  let result = 0;
  if (register.flagHalfCarry || (result & 0xF) > 0x09) {
    result += register.flagSubtract ? -0x06 : 0x06;
  }
  if (register.flagCarry || (result >> 4) > 0x09) {
    result += register.flagSubtract ? -0x06 : 0x06;
  }
  register.flagZero = register.A === 0;
  register.flagHalfCarry = false;
  register.flagCarry = register.flagCarry || result > 0xFF;
  register.A = result & 0xFF;
  return instruction.cycles[0];
}