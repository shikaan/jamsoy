// @ts-check
import { register as r } from "./registers.mjs";
import { decode as d } from "./decoder.mjs";
import { memory as m } from "./memory.mjs";
import { add, adc, sub, sbc, or, and, xor, cp, inc, ld, ldh, push, pop } from "./instructions/index.mjs";

/**
 * @param {import("./types").Instruction} intruction
 * @param {import("./types").Register} register
 * @param {Uint8Array} code
 * @param {DataView} memory
 */
function execute(intruction, register, code, memory) {
  switch (intruction.mnemonic) {
    case "NOP": break;
    case "ADD": return add(intruction, register, code)
    case "ADC": return adc(intruction, register, code)
    case "SUB": return sub(intruction, register, code)
    case "SBC": return sbc(intruction, register, code)
    case "AND": return and(intruction, register, code)
    case "OR": return or(intruction, register, code)
    case "XOR": return xor(intruction, register, code)
    case "CP": return cp(intruction, register, code)
    case "INC": return inc(intruction, register, code)
    case "DEC": return inc(intruction, register, code)
    case "LD": return ld(intruction, register, code)
    case "LDH": return ldh(intruction, register, code)
    case "PUSH": return push(intruction, register, memory)
    case "POP": return pop(intruction, register, memory)
    default:
      throw new Error(`Instruction ${intruction.mnemonic} not supprted.`)
  }
}

/**
 * @param {Uint8Array} code - The instruction stream to execute
 * @param {typeof d} decode 
 * @param {import("./types").Register} register 
 * @param {DataView} memory 
 */
function run(code, decode = d, register = r, memory = m) {
  while (true) {
    const address = register.PC
    const [newAddress, instruction] = decode(address, code)
    register.PC = newAddress
    execute(instruction, register, code, memory);
  }
}

export { run }