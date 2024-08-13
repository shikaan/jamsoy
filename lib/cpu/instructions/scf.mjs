export function scf(intruction, register) {
  register.flagSubtract = false;
  register.flagHalfCarry = false;
  register.flagCarry = true;
  return intruction.cycles[0];
}
