/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} registers
 * @param {DataView} memory
 */
function push(instruction, registers, memory) {
  const [register] = instruction.operands;
  registers.SP -= 2;
  memory.setUint16(registers.SP, registers[register.name], true);
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} registers
 * @param {DataView} memory
 */
function pop(instruction, registers, memory) {
  const [register] = instruction.operands;

  if (register.name === "AF") {
    registers.A = memory.getUint8(registers.SP + 1);
    registers.flagZero = (memory.getUint8(registers.SP) >> 7) & 1;
    registers.flagSubtract = (memory.getUint8(registers.SP) >> 6) & 1;
    registers.flagHalfCarry = (memory.getUint8(registers.SP) >> 5) & 1;
    registers.flagCarry = (memory.getUint8(registers.SP) >> 4) & 1;
  } else {
    registers[register.name] = memory.getUint16(registers.SP, true);
  }

  registers.SP += 2;
  return instruction.cycles[0];
}

export { push, pop };
