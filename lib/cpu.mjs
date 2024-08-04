import { register as r } from "./registers.mjs";
import { decode as d } from "./decoder.mjs";

/**
 * @param {import("./types").Instruction} intruction 
 */
function execute(intruction) {
  switch (intruction.mnemonic) {
    case "NOP": break
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
    const address = register.pc
    const [newAddress, instruction] = decode(address, data)
    register.pc = newAddress
    execute(instruction);
  }
}

export { run }