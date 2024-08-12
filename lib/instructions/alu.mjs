// @ts-check
import { GENERAL_PURPOSE } from "../registers.mjs";
import { getValueFromOperand, INVALID_INSTRUCTION_RETURN, setRegisterFromOperand } from "./_utils.mjs";

/**
 * @param {import("../types").Operand} operand
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} data
 */
function addA(operand, register, data) {
  const value = getValueFromOperand(operand, register, data);
  const result = register.A + value;

  register.flagZero = result == 0;
  register.flagSubtract = false;
  register.flagCarry = result > 0xFF;
  register.flagHalfCarry = (register.A & 0x0F) + (value & 0x0F) > 0x0F;
  register.A = result & 0xFF;
}

/**
 * @param {import("../types").Operand} operand
 * @param {import("../types").Register} register
 */
function addHL(operand, register) {
  const value = register[operand.name];
  const result = register.HL + value;
  register.flagZero = result == 0;
  register.flagSubtract = false;
  register.flagCarry = result > 0xFFFF;
  register.flagHalfCarry = (register.HL & 0xFFF) + (value & 0xFFF) > 0xFFF;
  register.HL = result & 0xFFFF;
}

/**
 * @param {import("../types").Operand} operand
 * @param {import("../types").Register} register
 */
function addSP(operand, register) {
  const value = /** @type {number} */ (operand.value)
  const signAdjusted = ((value ^ 0x80) - 0x80);
  const result = (register.SP + signAdjusted) & 0xFFFF;

  register.flagZero = false;
  register.flagSubtract = false;
  // FIXME: I could not find documentation on the following two lines. Might be incorrect.
  register.flagCarry = ((register.SP & 0xFF) + (value & 0xFF)) > 0xFF
  register.flagHalfCarry = ((register.SP & 0x0F) + (value & 0x0F)) > 0xF;
  register.SP = result;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {DataView} memory
 */
function add(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': addA(argument, register, memory); break;
    case 'HL': addHL(argument, register); break;
    case 'SP': addSP(argument, register); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function adc(instruction, register, memory) {
  const value = getValueFromOperand(instruction.operands[1], register, memory);
  const result = register.A + value + +register.flagCarry;

  register.flagZero = result == 0;
  register.flagSubtract = false;
  register.flagCarry = result > 0xFF;
  register.flagHalfCarry = (register.A & 0x0F) + (value & 0x0F) > 0x0F;
  register.A = result & 0xFF;
  return instruction.cycles[0];
}

/**
 * @param {import("../types").Operand} argument 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function andA(argument, register, memory) {
  const value = getValueFromOperand(argument, register, memory);
  const result = register.A & value;
  register.flagCarry = false;
  register.flagHalfCarry = true;
  register.flagZero = result === 0;
  register.flagSubtract = false;
  register.A = result;
}

/**
 * @param {import("../types").Operand} operand
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function subA(operand, register, memory) {
  const value = getValueFromOperand(operand, register, memory);
  const result = register.A - value;

  register.flagZero = result == 0;
  register.flagSubtract = true;
  register.flagCarry = result < 0;
  register.flagHalfCarry = ((register.A & 0x0F) - (value & 0x0F)) < 0;

  register.A = result & 0xFF;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function sub(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': subA(argument, register, memory); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function sbc(instruction, register, memory) {
  const value = getValueFromOperand(instruction.operands[1], register, memory);
  const result = register.A - value - +register.flagCarry;

  register.flagZero = result == 0;
  register.flagSubtract = true;
  register.flagCarry = result < 0;
  register.flagHalfCarry = ((register.A & 0x0F) - (value & 0x0F)) < 0;

  register.A = result & 0xFF;
  return instruction.cycles[0];
}


const INC_DEC_REGISTERS = GENERAL_PURPOSE.concat(["SP"]);

/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function inc(instruction, register, memory) {
  const destination = instruction.operands[0];

  if (!INC_DEC_REGISTERS.includes(destination.name)) {
    return INVALID_INSTRUCTION_RETURN;
  }

  const initialValue = getValueFromOperand(destination, register, memory);
  const value = (initialValue + 1) & 0xFF;
  setRegisterFromOperand(destination, register, memory, value);

  register.flagZero = value === 0;
  register.flagSubtract = false;
  register.flagHalfCarry = ((initialValue & 0x0F) + 1) > 0x0F;

  return instruction.cycles[0];
}


/**
 * @param {import("../types").Instruction} instruction 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function dec(instruction, register, memory) {
  const destination = instruction.operands[0];

  if (!INC_DEC_REGISTERS.includes(destination.name)) {
    return INVALID_INSTRUCTION_RETURN;
  }

  const initialValue = getValueFromOperand(destination, register, memory);
  const value = (initialValue - 1) & 0xFF;
  setRegisterFromOperand(destination, register, memory, value);

  register.flagZero = value === 0;
  register.flagSubtract = true;
  register.flagHalfCarry = ((initialValue & 0x0F) - 1) < 0;

  return instruction.cycles[0];
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function and(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': andA(argument, register, memory); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}

/**
 * @param {import("../types").Operand} argument 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function orA(argument, register, memory) {
  const value = getValueFromOperand(argument, register, memory);
  const result = register.A | value;
  register.flagCarry = false;
  register.flagHalfCarry = false;
  register.flagZero = result === 0;
  register.flagSubtract = false;
  register.A = result;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function or(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': orA(argument, register, memory); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}

/**
 * @param {import("../types").Operand} argument 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function xorA(argument, register, memory) {
  const value = getValueFromOperand(argument, register, memory);
  const result = register.A ^ value;
  register.flagCarry = false;
  register.flagHalfCarry = false;
  register.flagZero = result === 0;
  register.flagSubtract = false;
  register.A = result;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function xor(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': xorA(argument, register, memory); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}

/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 */
function cpA(operand, register, memory) {
  const value = getValueFromOperand(operand, register, memory);
  const result = register.A - value;

  register.flagZero = result == 0;
  register.flagSubtract = true;
  register.flagCarry = result < 0;
  register.flagHalfCarry = ((register.A & 0x0F) - (value & 0x0F)) < 0;
}

/**
 * @param {import("../types").Instruction} instruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 */
function cp(instruction, register, memory) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': cpA(argument, register, memory); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}

export { add, adc, sub, sbc, inc, dec, and, or, xor, cp }