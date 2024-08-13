export function cpl(instruction, register) {
  register.A = ~register.A & 0xff;
  register.flagSubtract = true;
  register.flagHalfCarry = true;
  return instruction.cycles[0];
}
