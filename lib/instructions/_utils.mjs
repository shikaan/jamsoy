// @ts-check
const INVALID_INSTRUCTION_RETURN = -1;

/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register 
 * @param {Uint8Array} data 
 * @returns {number}
 */
const getValueFromOperand = (operand, register, data) => operand.value ??
  operand.immediate
  ? register[operand.name]
  : data[register[operand.name]];

/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register
 * @param {Uint8Array} data
 * @param {number} value 
 */
const setRegisterFromOperand = (operand, register, data, value) => {
  if (operand.immediate) {
    register[operand.name] = value;
  } else {
    data[register[operand.name]] = value;
  }
}


export {
  getValueFromOperand,
  setRegisterFromOperand,
  INVALID_INSTRUCTION_RETURN
}