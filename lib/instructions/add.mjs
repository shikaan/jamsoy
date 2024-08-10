// @ts-check
import { getValueFromArithmeticOperand, INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

/**
 * @param {import("../types").Operand} operand
 * @param {import("../types").Register} register
 * @param {Uint8Array} data
 */
function addA(operand, register, data) {
  const value = getValueFromArithmeticOperand(operand, register, data);
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
 * @param {Uint8Array} data
 */
export function add(instruction, register, data) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': addA(argument, register, data); break;
    case 'HL': addHL(argument, register); break;
    case 'SP': addSP(argument, register); break;
    default: return INVALID_INSTRUCTION_RETURN;
  }

  return instruction.cycles[0];
}