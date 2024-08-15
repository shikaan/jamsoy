// @ts-check

import { decode as d } from "./decoder.mjs";
import {
  add,
  adc,
  sub,
  sbc,
  or,
  and,
  xor,
  cp,
  inc,
  ld,
  ldh,
  push,
  pop,
  daa,
  cpl,
  swap,
  ccf,
  scf,
  rlc,
  rl,
  rrc,
  rr,
  sla,
  sra,
  srl,
  bit,
  set,
  res,
  dec,
  jp,
  jr,
  call,
  rst,
  ret,
} from "./instructions/index.mjs";


class CPU {
  static CLOCK_SPEED = 4194304; // Clock cycles per second
  static MAX_CYCLES = 69905; // CLOCK_SPEED / 60 frames per second

  #register;
  #memory;
  #decode;
  #interrupts;

  /**
   * @param {import("../types").Memory} memory
   * @param {import("../types").Register} register
   * @param {import("../types").Interrupts} interrupts
   */
  constructor(memory, register, interrupts, decode = d) {
    this.#register = register;
    this.#decode = decode;
    this.#memory = memory;
    this.#interrupts = interrupts;
  }

  /**
 * @param {import("../types").Instruction} intruction
 * @param {import("../types").Register} register
 * @param {import("../types").Memory} memory
 * @returns {number} The number of cycles the instruction took
 */
  #execute(intruction, register, memory) {
    switch (intruction.mnemonic) {
      case "NOP":
      case "HALT":
      case "STOP":
        return intruction.cycles[0];
      case "ADD":
        return add(intruction, register, memory);
      case "ADC": import("../types")
        return adc(intruction, register, memory);
      case "SUB":
        return sub(intruction, register, memory);
      case "SBC":
        return sbc(intruction, register, memory);
      case "AND":
        return and(intruction, register, memory);
      case "OR":
        return or(intruction, register, memory);
      case "XOR":
        return xor(intruction, register, memory);
      case "CP":
        return cp(intruction, register, memory);
      case "INC":
        return inc(intruction, register, memory);
      case "DEC":
        return dec(intruction, register, memory);
      case "LD":
        return ld(intruction, register, memory);
      case "LDH":
        return ldh(intruction, register, memory);
      case "PUSH":
        return push(intruction, register, memory);
      case "POP":
        return pop(intruction, register, memory);
      case "DAA":
        return daa(intruction, register);
      case "CPL":
        return cpl(intruction, register);
      case "SWAP":
        return swap(intruction, register, memory);
      case "CCF":
        return ccf(intruction, register);
      case "SCF":
        return scf(intruction, register);
      case "DI": {
        this.#interrupts.allowInterrupts = false;
        return intruction.cycles[0];
      }
      case "EI": {
        this.#interrupts.allowInterrupts = true;
        return intruction.cycles[0];
      }
      case "RLCA":
        return rlc(intruction, register, memory);
      case "RLA":
        return rl(intruction, register, memory);
      case "RRCA":
        return rrc(intruction, register, memory);
      case "RRA":
        return rr(intruction, register, memory);
      case "RLC":
        return rlc(intruction, register, memory);
      case "RL":
        return rl(intruction, register, memory);
      case "RRC":
        return rrc(intruction, register, memory);
      case "RR":
        return rr(intruction, register, memory);
      case "SLA":
        return sla(intruction, register, memory);
      case "SRA":
        return sra(intruction, register, memory);
      case "SRL":
        return srl(intruction, register, memory);
      case "BIT":
        return bit(intruction, register, memory);
      case "SET":
        return set(intruction, register, memory);
      case "RES":
        return res(intruction, register, memory);
      case "JP":
        return jp(intruction, register, memory);
      case "JR":
        return jr(intruction, register, memory);
      case "CALL":
        return call(intruction, register, memory);
      case "RST":
        return rst(intruction, register, memory);
      case "RET":
        return ret(intruction, register, memory);
      case "RETI": {
        this.#interrupts.allowInterrupts = true;
        return ret(intruction, register, memory);
      }
      default:
        throw new Error(`Instruction ${intruction.mnemonic} not supprted.`);
    }
  }

  /**
   * @param {Uint8Array} code - The instruction stream
   */
  executeNextIntruction(code) {
    const address = this.#register.PC;
    const [newAddress, instruction] = this.#decode(address, code);
    this.#register.PC = newAddress;
    return this.#execute(instruction, this.#register, this.#memory);
  }

  initialize() {
    this.#register.PC = 0x100;
    this.#register.SP = 0xFFFE;
    this.#register.AF = 0x01B0;
    this.#register.BC = 0x0013;
    this.#register.DE = 0x00D8;
    this.#register.HL = 0x014D;
  }
}

export { CPU };
