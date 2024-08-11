export function cpl(instruction, register) {
  register.A = ~register.A & 0xFF;
  register.flagSubtract = true;
  register.flagHalfCarry = true;
  return instruction.cycles[0];
}