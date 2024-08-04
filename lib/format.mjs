/**
 * @param {number} i 
 * @returns {string}
 */
function hex(i) {
  return `0x${i.toString(16).padStart(4, '0').toUpperCase()}`
}

/**
 * @param {import('./types').Operand} operand 
 * @returns {string}
 */
function operand(operand) {
  const value = operand.value != null ? hex(operand.value) : operand.name
  return operand.immediate ? value : `(${value})`
}

/**
 * @param {import('./types').Instruction} instruction 
 * @returns {string}
 */
function instruction(instruction) {
  return `${instruction.mnemonic.padEnd(8, ' ')} ${instruction.operands.map(operand).join(', ')}`
}

export const format = {
  hex,
  operand,
  instruction
}