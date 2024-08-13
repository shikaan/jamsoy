// @ts-check
const INVALID_INSTRUCTION_RETURN = -1;

/**
 * @param {import("../../types").Operand} operand
 * @param {import("../../types").Register} register
 * @param {import("../../types").Memory} memory
 * @returns {number}
 */
const readByteFromOperand = (operand, register, memory) =>
  (operand.value ?? operand.immediate)
    ? register[operand.name]
    : memory.readByte(register[operand.name]);

/**
 * @param {import("../../types").Operand} operand
 * @param {import("../../types").Register} register
 * @param {import("../../types").Memory} memory
 * @param {number} value
 */
const writeByteFromOperand = (operand, register, memory, value) => {
  if (operand.immediate) {
    register[operand.name] = value;
  } else {
    memory.writeByte(register[operand.name], value);
  }
};

export {
  readByteFromOperand,
  writeByteFromOperand,
  INVALID_INSTRUCTION_RETURN,
};
