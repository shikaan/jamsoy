export function ccf(instruction, register) {
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagCarry = !register.flagCarry;
  return instruction.cycles[0];
}
