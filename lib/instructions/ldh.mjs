// @ts-check
function ldh_$a8$a(instruction, registers, data) {
  const [destination] = instruction.operands;
  data[0xFF00 + destination.value] = registers.A;
  return instruction.cycles[0];
}

function ldh_a_$a8(instruction, registers, data) {
  const [source] = instruction.operands;
  registers.A = data[0xFF00 + source.value];
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {Uint8Array} data 
 */
export function ldh(instruction, registers, data) {
  const [destination] = instruction.operands;
  return destination.name === 'a8'
    ? ldh_$a8$a(instruction, registers, data)
    : ldh_a_$a8(instruction, registers, data);
}