// @ts-check

import { INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory 
 */
function ldh_$a8$a(instruction, registers, memory) {
  const [destination] = instruction.operands;
  if (destination.value == null) return INVALID_INSTRUCTION_RETURN;
  memory.setUint8(0xFF00 + destination.value, registers.A);
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory 
 */
function ldh_a_$a8(instruction, registers, memory) {
  const [source] = instruction.operands;
  if (source.value == null) return INVALID_INSTRUCTION_RETURN;
  registers.A = memory.getUint8(0xFF00 + source.value);
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory 
 */
export function ldh(instruction, registers, memory) {
  const [destination] = instruction.operands;
  return destination.name === 'a8'
    ? ldh_$a8$a(instruction, registers, memory)
    : ldh_a_$a8(instruction, registers, memory);
}