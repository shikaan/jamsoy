// @ts-check
import { register as r } from "./registers.mjs";
import { decode as d } from "./decoder.mjs";
import { add, adc, sub, sbc, or, and, xor, cp } from "./instructions/index.mjs";

/**
 * @param {import("./types").Instruction} intruction
 * @param {import("./types").Register} register
 * @param {Uint8Array} data
 */
function execute(intruction, register, data) {
  switch (intruction.mnemonic) {
    case "NOP": break;
    case "ADD": return add(intruction, register, data)
    case "ADC": return adc(intruction, register, data)
    case "SUB": return sub(intruction, register, data)
    case "SBC": return sbc(intruction, register, data)
    case "AND": return and(intruction, register, data)
    case "OR": return or(intruction, register, data)
    case "XOR": return xor(intruction, register, data)
    case "CP": return cp(intruction, register, data)
    default:
      throw new Error(`Instruction ${intruction.mnemonic} not supprted.`)
  }
}

/**
 * @param {Uint8Array} data - The instruction stream to execute
 * @param {typeof d} decode 
 * @param {import("./types").Register} register 
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