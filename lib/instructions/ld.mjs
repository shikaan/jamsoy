// @ts-check
import { GENERAL_PURPOSE_R16, GENERAL_PURPOSE_R8 } from "../registers.mjs";
import { INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";
// Converntion $hl$ means [HL]

/**
 * Load a value from a R8 register into A,B,C,D,E,H,L register
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {Uint8Array} data 
 */
function ld_r8r8(instruction, registers, data) {
  const [destination, source] = instruction.operands
  registers[destination.name] = registers[source.name]
  return instruction.cycles[0];
}

/**
 * Load a value from memory at the address in HL into A,B,C,D,E,H,L
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {Uint8Array} data 
 */
function ld_r8$hl$(instruction, registers, data) {
  const [destination] = instruction.operands
  registers[destination.name] = data[registers.HL]
  return instruction.cycles[0];
}

function ld_r8n8(instruction, registers, data) {
  const [destination, source] = instruction.operands
  registers[destination.name] = source.value
  return instruction.cycles[0];
}

function ld_$hl$r8(instruction, registers, data) {
  const [_, source] = instruction.operands
  data[registers.HL] = registers[source.name]
  return instruction.cycles[0];
}

function ld_$hl$n8(instruction, registers, data) {
  const [_, source] = instruction.operands
  data[registers.HL] = source.value
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} registers 
 * @param {Uint8Array} data
 */
function ld_$r16$a(instruction, registers, data) {
  const [source] = instruction.operands
  data[registers[source.name]] = registers.A

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
 * @param {Uint8Array} data
 */
function ld_a$r16$(instruction, registers, data) {
  const [source] = instruction.operands
  registers.A = data[registers[source.name]]

  if (source.increment) {
    registers.HL = (registers[source.name] + 1) & 0xFFFF
  }

  if (source.decrement) {
    registers.HL = (registers[source.name] - 1) & 0xFFFF
  }

  return instruction.cycles[0];
}

function ld_a$c$(instruction, registers, data) {
  registers.A = data[0xFF00 + +registers.C]
  return instruction.cycles[0];
}

function ld_$c$a(instruction, registers, data) {
  data[0xFF00 + +registers.C] = registers.A
  return instruction.cycles[0];
}

function ld_a$a16$(instruction, registers, data) {
  const [_, source] = instruction.operands
  registers.A = data[source.value]
  return instruction.cycles[0];
}

function ld_$a16$a(instruction, registers, data) {
  const [destination] = instruction.operands
  data[destination.value] = registers.A
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Operand} param0
 */
const isNonImmediateR16 = ({ immediate, name }) => !immediate && GENERAL_PURPOSE_R16.includes(name)

function ld_r16n16(instruction, registers, _data) {
  const [destination, source] = instruction.operands
  registers[destination.name] = source.value
  return instruction.cycles[0];
}

function ld_$a16$sp(instruction, registers, data) {
  const [destination] = instruction.operands
  data[destination.value] = registers.SP & 0xFF
  data[destination.value + 1] = registers.SP >> 8
  return instruction.cycles[0];
}

function ld_sphl(instruction, registers, _data) {
  registers.SP = registers.HL
  return instruction.cycles[0];
}

function ld_hlspn(instruction, registers, _data) {
  const [_, source] = instruction.operands
  const result = registers.SP + source.value
  registers.HL = result & 0xFFFF
  registers.flagZero = 0
  registers.flagSubtract = 0
  registers.flagHalfCarry = (registers.SP & 0xF) + (source.value & 0xF) > 0xF
  registers.flagCarry = (registers.SP & 0xFF) + (source.value & 0xFF) > 0xFF
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} registers
 * @param {Uint8Array} data
 */
export function ld(instruction, registers, data) {
  const [destination, source] = instruction.operands

  if (destination.name == "C") {
    return ld_$c$a(instruction, registers, data)
  }

  if (source.name == "a16") {
    return destination.name === 'SP'
      ? ld_$a16$sp(instruction, registers, data)
      : ld_$a16$a(instruction, registers, data)
  }

  if (GENERAL_PURPOSE_R8.includes(destination.name)) {
    if (destination.name == "A") {
      if (source.name == "C") {
        return ld_a$c$(instruction, registers, data)
      }

      if (source.name == "a16") {
        return ld_a$a16$(instruction, registers, data)
      }

      if (isNonImmediateR16(source)) {
        return ld_a$r16$(instruction, registers, data)
      }
    }

    if (source.name == "HL") {
      return ld_r8$hl$(instruction, registers, data)
    }

    if (source.name == "n8") {
      return ld_r8n8(instruction, registers, data)
    }

    if (GENERAL_PURPOSE_R8.includes(source.name)) {
      return ld_r8r8(instruction, registers, data)
    }
  }

  if (isNonImmediateR16(destination)) {
    if (source.name == "A") {
      return ld_$r16$a(instruction, registers, data)
    }
  }

  if (destination.name == "HL") {
    if (source.name == "n8") {
      return ld_$hl$n8(instruction, registers, data)
    }

    if (source.name == "n16") {
      return ld_r16n16(instruction, registers, data)
    }

    if (source.name == "SP") {
      return ld_hlspn(instruction, registers, data)
    }

    if (GENERAL_PURPOSE_R8.includes(source.name)) {
      return ld_$hl$r8(instruction, registers, data)
    }
  }

  if (['BC', 'DE', 'SP'].includes(destination.name)) {
    if (source.name == "n16") {
      return ld_r16n16(instruction, registers, data)
    }
  }

  if (destination.name == "SP") {
    if (source.name == "HL") {
      return ld_sphl(instruction, registers, data)
    }
  }

  return INVALID_INSTRUCTION_RETURN;
}