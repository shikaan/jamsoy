// @ts-check

import { INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} registers
 * @param {boolean} flag
 * @param {number} newPC
 * @returns {number}
 */
const conditionalJump = (instruction, registers, flag, newPC) => {
  if (flag) {
    registers.PC = newPC;
    return instruction.cycles[0];
  }
  return instruction.cycles[1];
}

/**
 * @type {import("../types").InstructionExecutor}
 */
function jp(instruction, registers, _memory) {
  const [first, second] = instruction.operands;

  switch (first.name) {
    case "a16":
      if (first.value == null) return INVALID_INSTRUCTION_RETURN;
      registers.PC = first.value;
      return instruction.cycles[0];
    case "NZ":
      return conditionalJump(instruction, registers, !registers.flagZero, /** @type {number} */(second.value));
    case "Z":
      return conditionalJump(instruction, registers, registers.flagZero, /** @type {number} */(second.value));
    case "NC":
      return conditionalJump(instruction, registers, !registers.flagCarry, /** @type {number} */(second.value));
    case "C":
      return conditionalJump(instruction, registers, registers.flagCarry, /** @type {number} */(second.value));
    case "HL":
      registers.PC = registers.HL;
      return instruction.cycles[0];
  }

  return INVALID_INSTRUCTION_RETURN
}

/**
 * @type {import("../types").InstructionExecutor}
 */
function jr(instruction, registers, _memory) {
  const [first, second] = instruction.operands;

  switch (first.name) {
    case "e8":
      registers.PC += /** @type {number} */(first.value);
      return instruction.cycles[0];
    case "NZ":
      return conditionalJump(instruction, registers, !registers.flagZero, registers.PC + /** @type {number} */(second.value));
    case "Z":
      return conditionalJump(instruction, registers, registers.flagZero, registers.PC + /** @type {number} */(second.value));
    case "NC":
      return conditionalJump(instruction, registers, !registers.flagCarry, registers.PC + /** @type {number} */(second.value));
    case "C":
      return conditionalJump(instruction, registers, registers.flagCarry, registers.PC + /** @type {number} */(second.value));
  }

  return INVALID_INSTRUCTION_RETURN
}

export { jp, jr };
