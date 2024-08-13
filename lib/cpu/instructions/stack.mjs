//@ts-check

/**
 * @param {import("../../types").Instruction} instruction
 * @param {import("../../types").Register} registers
 * @param {import("../../types").Memory} memory
 */
function push(instruction, registers, memory) {
  const [register] = instruction.operands;
  registers.SP -= 2;
  memory.writeWord(registers.SP, registers[register.name]);
  return instruction.cycles[0];
}

/**
 * @param {import("../../types").Instruction} instruction
 * @param {import("../../types").Register} registers
 * @param {import("../../types").Memory} memory
 */
function pop(instruction, registers, memory) {
  const [register] = instruction.operands;

  if (register.name === "AF") {
    registers.A = memory.readByte(registers.SP + 1);
    registers.flagZero = !!((memory.readByte(registers.SP) >> 7) & 1);
    registers.flagSubtract = !!((memory.readByte(registers.SP) >> 6) & 1);
    registers.flagHalfCarry = !!((memory.readByte(registers.SP) >> 5) & 1);
    registers.flagCarry = !!((memory.readByte(registers.SP) >> 4) & 1);
  } else {
    registers[register.name] = memory.readWord(registers.SP);
  }

  registers.SP += 2;
  return instruction.cycles[0];
}

export { push, pop };
