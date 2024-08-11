// @ts-check
const INVALID_INSTRUCTION_RETURN = -1;

/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register 
 * @param {import("../types").Memory} memory 
 * @returns {number}
 */
const getValueFromOperand = (operand, register, memory) => operand.value ??
  operand.immediate
  ? register[operand.name]
  : memory.getUint8(register[operand.name]);

/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory 
 * @param {number} value 
 */
const setRegisterFromOperand = (operand, register, memory, value) => {
  if (operand.immediate) {
    register[operand.name] = value;
  } else {
    memory.setUint8(register[operand.name], value);
  }
}


export {
  getValueFromOperand,
  setRegisterFromOperand,
  INVALID_INSTRUCTION_RETURN
}