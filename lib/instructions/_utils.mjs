/**
 * @param {import("../types").Operand} operand 
 * @param {import("../types").Register} register 
 * @param {Uint8Array} data 
 * @returns {number}
 */
const getValueFromArithmeticOperand = (operand, register, data) => operand.name == "n8"
  ? operand.value
  : operand.name == "HL"
    ? data[register.HL]
    : register[operand.name];

const INVALID_INSTRUCTION_RETURN = -1;

export { getValueFromArithmeticOperand, INVALID_INSTRUCTION_RETURN }