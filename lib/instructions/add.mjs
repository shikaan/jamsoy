// @ts-check
import { register } from "../registers.mjs";

/**
 * @param {number} a
 * @param {number} b
 * @param {number} overflow
 * @returns {[number, boolean]}
 */
const addOverflow = (a, b, overflow) => {
  const sum = (a + b);
  return [sum & overflow, sum > overflow];
};

const add4 = (/** @type {number} */ a, /** @type {number} */ b) => addOverflow(a, b, 0xF);
const add8 = (/** @type {number} */ a, /** @type {number} */ b) => addOverflow(a, b, 0xFF);
const add12 = (/** @type {number} */ a, /** @type {number} */ b) => addOverflow(a, b, 0xFFF);
const add16 = (/** @type {number} */ a, /** @type {number} */ b) => addOverflow(a, b, 0xFFFF);

/**
 * @param {import("../types").Operand} operand
 * @param {typeof register} register
 * @param {Uint8Array} data
 */
function addA(operand, register, data) {
  const value = operand.name == "n8"
    ? operand.value
    : operand.name == "HL"
      ? data[register.HL]
      : register[operand.name];

  const [result, carry] = add8(register.A, value);
  const [_, halfCarry] = add4(register.A, value);
  register.a = result;
  register.flagZero = result == 0;
  register.flagSubtract = false;
  register.flagCarry = carry;
  register.flagHalfCarry = halfCarry;
}

/**
 * @param {import("../types").Operand} operand
 * @param {typeof register} register
 */
function addHL(operand, register) {
  const [result, carry] = add16(register.A, register[operand.name]);
  const [_, halfCarry] = add12(register.A, register[operand.name]);
  register.HL = result;
  register.flagZero = result == 0;
  register.flagSubtract = false;
  register.flagCarry = carry;
  register.flagHalfCarry = halfCarry;
}

/**
 * @param {import("../types").Operand} operand
 * @param {typeof register} register
 */
function addSP(operand, register) {
  if (!operand.value) throw new Error();
  const signAdjusted = ((operand.value ^ 0x80) - 0x80);
  const result = (register.SP + signAdjusted) & 0xFFFF;

  register.flagZero = false;
  register.flagSubtract = false;
  register.flagCarry = ((register.SP & 0x0F) + (operand.value & 0x0F)) > 0xF;
  register.flagHalfCarry = ((register.SP & 0xFF) + operand.value) > 0xFF;
  register.SP = result;
}

export function add(instruction, register, data) {
  const [destination, argument] = instruction.operands;

  switch (destination.name) {
    case 'A': return addA(argument, register, data);
    case 'HL': return addHL(argument, register);
    case 'SP': return addSP(argument, register);
  }
}