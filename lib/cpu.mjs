// @ts-check
import { register as r } from "./registers.mjs";
import { decode as d } from "./decoder.mjs";
import { add } from "./instructions/add.mjs";

/**
 * @param {import("./types").Instruction} intruction
 * @param {typeof r} register
 * @param {Uint8Array} data
 */
function execute(intruction, register, data) {
  switch (intruction.mnemonic) {
    case "NOP": break;
    case "ADD": return add(intruction, register, data)
    default:
      throw new Error(`Instruction ${intruction.mnemonic} not supprted.`)
  }
}

/**
 * @param {Uint8Array} data - The instruction stream to execute
 * @param {typeof d} decode 
 * @param {typeof r} register 
 */
function run(data, decode = d, register = r) {
  while (true) {
    const address = register.PC
    const [newAddress, instruction] = decode(address, data)
    register.PC = newAddress
    execute(instruction, register, data);
  }
}

export { run }