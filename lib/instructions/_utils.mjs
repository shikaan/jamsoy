// @ts-check

/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register 
 * @param {Uint8Array} data 
 * @returns {number}
 */
const getValueFromOperand = (operand, register, data) => operand.name == "n8"
  ? operand.value
  : operand.name == "HL"
    ? data[register.HL]
    : register[operand.name];

/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register
 * @param {Uint8Array} data
 * @param {number} value 
 */
const setRegisterFromOperand = (operand, register, data, value) => {
  if (!IMMEDIATE_REGISTERS.includes(operand.name)) {
    // TODO: should this throw?
    return;
  }

  if (operand.immediate) {
    register[operand.name] = value;
  } else {
    data[register[operand.name]] = value;
  }
}

const INVALID_INSTRUCTION_RETURN = -1;
const IMMEDIATE_REGISTERS = ["A", "B", "C", "D", "E", "H", "L", "BC", "DE", "HL", "SP"];

export {
  getValueFromOperand,
  setRegisterFromOperand,
  INVALID_INSTRUCTION_RETURN,
  IMMEDIATE_REGISTERS
}