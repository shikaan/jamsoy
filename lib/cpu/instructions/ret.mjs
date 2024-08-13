// @ts-check

import { INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @type {import("../../types").InstructionExecutor}
 */
function ret(instruction, register, memory) {
  if (instruction.operands.length === 0) {
    return popAndJump(register, memory, instruction);
  }

  const [first] = instruction.operands;

  if (first.name === "NZ") {
    return !register.flagZero
      ? popAndJump(register, memory, instruction)
      : instruction.cycles[1];
  } else if (first.name === "Z") {
    return register.flagZero
      ? popAndJump(register, memory, instruction)
      : instruction.cycles[1];
  } else if (first.name === "NC") {
    return !register.flagCarry
      ? popAndJump(register, memory, instruction)
      : instruction.cycles[1];
  } else if (first.name === "C") {
    return register.flagCarry
      ? popAndJump(register, memory, instruction)
      : instruction.cycles[1];
  }

  return INVALID_INSTRUCTION_RETURN;
}

function popAndJump(register, memory, instruction) {
  register.PC = memory.getUint16(register.SP, true);
  register.SP += 2;
  return instruction.cycles[0];
}

export { ret };
