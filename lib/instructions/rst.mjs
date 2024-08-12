//@ts-check

/**
 * @type {import("../types").InstructionExecutor}
 */
function rst(instruction, registers, memory) {
  const [address] = instruction.operands;
  const value = Number.parseInt(address.name.slice(1), 16);
  memory.setUint16(registers.SP, registers.PC, true);
  registers.SP -= 2;
  registers.PC = value;
  return instruction.cycles[0];
}

export { rst }