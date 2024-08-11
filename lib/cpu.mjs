// @ts-check
import { register as r } from "./registers.mjs";
import { decode as d } from "./decoder.mjs";
import { memory as m } from "./memory.mjs";
import { add, adc, sub, sbc, or, and, xor, cp, inc, ld, ldh, push, pop } from "./instructions/index.mjs";

/**
 * @param {import("./types").Instruction} intruction
 * @param {import("./types").Register} register
 * @param {import("./types").Memory} memory
 */
function execute(intruction, register, memory) {
  switch (intruction.mnemonic) {
    case "NOP": break;
    case "ADD": return add(intruction, register, memory)
    case "ADC": return adc(intruction, register, memory)
    case "SUB": return sub(intruction, register, memory)
    case "SBC": return sbc(intruction, register, memory)
    case "AND": return and(intruction, register, memory)
    case "OR": return or(intruction, register, memory)
    case "XOR": return xor(intruction, register, memory)
    case "CP": return cp(intruction, register, memory)
    case "INC": return inc(intruction, register, memory)
    case "DEC": return inc(intruction, register, memory)
    case "LD": return ld(intruction, register, memory)
    case "LDH": return ldh(intruction, register, memory)
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
 * @param {import("./types").Memory} memory 
 */
function run(code, decode = d, register = r, memory = m) {
  while (true) {
    const address = register.PC
    const [newAddress, instruction] = decode(address, code)
    register.PC = newAddress
    execute(instruction, register, memory);
  }
}

export { run }