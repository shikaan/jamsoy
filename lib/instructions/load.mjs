// @ts-check
import { memory } from "../memory.mjs";
import { GENERAL_PURPOSE_R16, GENERAL_PURPOSE_R8 } from "../registers.mjs";
import { INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";
// Converntion $hl$ means [HL]

/**
 * Load a value from a R8 register into A,B,C,D,E,H,L register
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 */
function ld_r8r8(instruction, registers) {
  const [destination, source] = instruction.operands
  registers[destination.name] = registers[source.name]
  return instruction.cycles[0];
}

/**
 * Load a value from memory at the address in HL into A,B,C,D,E,H,L
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory 
 */
function ld_r8$hl$(instruction, registers, memory) {
  const [destination] = instruction.operands
  registers[destination.name] = memory.getUint8(registers.HL)
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers
 */
function ld_r8n8(instruction, registers) {
  const [destination, source] = instruction.operands
  registers[destination.name] = source.value
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers
 * @param {import("../types").Memory} memory
 */
function ld_$hl$r8(instruction, registers, memory) {
  const [_, source] = instruction.operands
  memory.setUint8(registers.HL, registers[source.name])
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers
 * @param {import("../types").Memory} memory
 */
function ld_$hl$n8(instruction, registers, memory) {
  const [_, source] = instruction.operands

  if (source.value == null) {
    return INVALID_INSTRUCTION_RETURN
  }

  memory.setUint8(registers.HL, source.value)
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory
 */
function ld_$r16$a(instruction, registers, memory) {
  const [source] = instruction.operands
  memory.setUint8(registers[source.name], registers.A)

  if (source.increment) {
    registers.HL = (registers[source.name] + 1) & 0xFFFF
  }

  if (source.decrement) {
    registers.HL = (registers[source.name] - 1) & 0xFFFF
  }

  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory
 */
function ld_a$r16$(instruction, registers, memory) {
  const [source] = instruction.operands
  registers.A = memory.getUint8(registers[source.name])

  if (source.increment) {
    registers.HL = (registers[source.name] + 1) & 0xFFFF
  }

  if (source.decrement) {
    registers.HL = (registers[source.name] - 1) & 0xFFFF
  }

  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory
 */
function ld_a$c$(instruction, registers, memory) {
  registers.A = memory.getUint8(0xFF00 + +registers.C)
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory
 */
function ld_$c$a(instruction, registers, memory) {
  memory.setUint8(0xFF00 + +registers.C, registers.A)
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory
 */
function ld_a$a16$(instruction, registers, memory) {
  const [_, source] = instruction.operands
  if (source.value == null) {
    return INVALID_INSTRUCTION_RETURN
  }
  registers.A = memory.getUint8(source.value)
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory
 */
function ld_$a16$a(instruction, registers, memory) {
  const [destination] = instruction.operands
  if (destination.value == null) {
    return INVALID_INSTRUCTION_RETURN
  }
  memory.setUint8(destination.value, registers.A)
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Operand} param0
 */
const isNonImmediateR16 = ({ immediate, name }) => !immediate && GENERAL_PURPOSE_R16.includes(name)

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers
 */
function ld_r16n16(instruction, registers) {
  const [destination, source] = instruction.operands
  registers[destination.name] = source.value
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {import("../types").Memory} memory
 */
function ld_$a16$sp(instruction, registers, memory) {
  const [destination] = instruction.operands

  if (destination.value == null) {
    return INVALID_INSTRUCTION_RETURN
  }

  memory.setUint8(destination.value, registers.SP & 0xFF)
  memory.setUint8(destination.value + 1, registers.SP >> 8)
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers
 */
function ld_sphl(instruction, registers) {
  registers.SP = registers.HL
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers
 */
function ld_hlspn(instruction, registers) {
  const [_, source] = instruction.operands

  if (source.value == null) {
    return INVALID_INSTRUCTION_RETURN
  }

  const result = registers.SP + source.value
  registers.HL = result & 0xFFFF
  registers.flagZero = false
  registers.flagSubtract = false
  registers.flagHalfCarry = (registers.SP & 0xF) + (source.value & 0xF) > 0xF
  registers.flagCarry = (registers.SP & 0xFF) + (source.value & 0xFF) > 0xFF
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} registers
 * @param {import("../types").Memory} memory
 */
function ld(instruction, registers, memory) {
  const [destination, source] = instruction.operands

  if (destination.name == "C") {
    return ld_$c$a(instruction, registers, memory)
  }

  if (source.name == "a16") {
    return destination.name === 'SP'
      ? ld_$a16$sp(instruction, registers, memory)
      : ld_$a16$a(instruction, registers, memory)
  }

  if (GENERAL_PURPOSE_R8.includes(destination.name)) {
    if (destination.name == "A") {
      if (source.name == "C") {
        return ld_a$c$(instruction, registers, memory)
      }

      if (source.name == "a16") {
        return ld_a$a16$(instruction, registers, memory)
      }

      if (isNonImmediateR16(source)) {
        return ld_a$r16$(instruction, registers, memory)
      }
    }

    if (source.name == "HL") {
      return ld_r8$hl$(instruction, registers, memory)
    }

    if (source.name == "n8") {
      return ld_r8n8(instruction, registers)
    }

    if (GENERAL_PURPOSE_R8.includes(source.name)) {
      return ld_r8r8(instruction, registers)
    }
  }

  if (isNonImmediateR16(destination)) {
    if (source.name == "A") {
      return ld_$r16$a(instruction, registers, memory)
    }
  }

  if (destination.name == "HL") {
    if (source.name == "n8") {
      return ld_$hl$n8(instruction, registers, memory)
    }

    if (source.name == "n16") {
      return ld_r16n16(instruction, registers)
    }

    if (source.name == "SP") {
      return ld_hlspn(instruction, registers)
    }

    if (GENERAL_PURPOSE_R8.includes(source.name)) {
      return ld_$hl$r8(instruction, registers, memory)
    }
  }

  if (['BC', 'DE', 'SP'].includes(destination.name)) {
    if (source.name == "n16") {
      return ld_r16n16(instruction, registers)
    }
  }

  if (destination.name == "SP") {
    if (source.name == "HL") {
      return ld_sphl(instruction, registers)
    }
  }

  return INVALID_INSTRUCTION_RETURN;
}

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
function ldh(instruction, registers, memory) {
  const [destination] = instruction.operands;
  return destination.name === 'a8'
    ? ldh_$a8$a(instruction, registers, memory)
    : ldh_a_$a8(instruction, registers, memory);
}

export { ldh, ld }