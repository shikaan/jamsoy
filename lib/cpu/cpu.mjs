// @ts-check

import { format } from "../format.mjs";
import { UNPREFIXED, PREFIXED } from "./opcodes.mjs";

const isHalfCarry8 = (oldVal, newVal) => (oldVal & 0xF) + (newVal & 0xF) > 0xF
const isHalfCarry16 = (oldVal, newVal) => (oldVal & 0xFFF) + (newVal & 0xFFF) > 0xFFF
const isHalfBorrow8 = (oldVal, newVal) => (oldVal & 0xF) - (newVal & 0xF) < 0
const isHalfBorrow16 = (oldVal, newVal) => (oldVal & 0xFFF) - (newVal & 0xFFF) < 0

const rotateLeft8 = (/** @type {number} */ x) => (0b10000000 & x) == 0 ? x << 1 : (x << 1) + 1
const rotateRight8 = (/** @type {number} */ x) => (1 & x) == 0 ? x >> 1 : (x >> 1) + 0b10000000
const rotateThroughCarryLeft8 = (/** @type {number} */ x, /** @type {boolean} */ carry) => {
  const result = (x << 1) + +carry
  return [result & 0xFF, x >> 7]
}
const rotateThroughCarryRight8 = (/** @type {number} */ x, /** @type {boolean} */ carry) => {
  const result = (x >> 1) + (+carry << 7)
  return [result & 0xFF, x & 1]
}

class CPU {
  static CLOCK_SPEED = 4194304; // Clock cycles per second
  static MAX_CYCLES = 69905; // CLOCK_SPEED / 60 frames per second

  #register;
  #memory;
  #interrupts;
  #halted = false;

  /**
   * @param {import("../types").Memory} memory
   * @param {import("../types").Register} register
   * @param {import("../types").Interrupts} interrupts
   */
  constructor(memory, register, interrupts) {
    this.#register = register;
    this.#memory = memory;
    this.#interrupts = interrupts;
  }

  /**
   * @returns {number} The number of cycles the instruction took
   */
  executeNextIntruction() {
    return this.#execute();
  }

  initialize() {
    this.#register.PC = 0x100;
    this.#register.SP = 0xFFFE;
    this.#register.AF = 0x01B0;
    this.#register.BC = 0x0013;
    this.#register.DE = 0x00D8;
    this.#register.HL = 0x014D;
  }

  /**
   * @returns {number} The number of cycles the instruction took
   */
  #execute() {
    const opcode = this.#memory.readByte(this.#register.PC);
    this.#register.PC++;

    switch (opcode) {
      case 0x00:
        // NOP
        return 4;
      case 0x01:
        // LD BC, n16
        this.#register.BC = this.#memory.readWord(this.#register.PC);
        this.#register.PC += 2;
        return 12;
      case 0x02:
        // LD (BC), A
        this.#memory.writeByte(this.#register.BC, this.#register.A);
        return 8;
      case 0x03:
        // INC BC
        this.#register.BC++;
        return 8;
      case 0x04: {
        // INC B
        this.#inc8('B');
        return 4;
      }
      case 0x05: {
        // DEC B
        this.#dec8('B');
        return 4;
      }
      case 0x06:
        // LD B, n8
        this.#register.B = this.#memory.readByte(this.#register.PC);
        this.#register.PC++;
        return 8;
      case 0x07: {
        // RLCA
        const result = rotateLeft8(this.#register.A);
        this.#register.flagZero = false;
        this.#register.flagSubtract = false;
        this.#register.flagHalfCarry = false;
        this.#register.flagCarry = (this.#register.A & 0b10000000) != 0;
        this.#register.A = result & 0xFF;
        return 4;
      }
      case 0x08:
        // LD (a16), SP
        this.#memory.writeWord(this.#memory.readWord(this.#register.PC), this.#register.SP);
        this.#register.PC += 2;
        return 20;
      case 0x09: {
        // ADD HL, BC
        this.#add16('HL', 'BC');
        return 8;
      }
      case 0x0A:
        // LD A, (BC)
        this.#register.A = this.#memory.readByte(this.#register.BC);
        return 8;
      case 0x0B: {
        // DEC BC
        this.#register.BC--;
        return 8;
      }
      case 0x0C: {
        // INC C
        this.#inc8('C');
        return 4;
      }
      case 0x0D: {
        // DEC C
        this.#dec8('C');
        return 4;
      }
      case 0x0E:
        // LD C, n8
        this.#register.C = this.#memory.readByte(this.#register.PC);
        this.#register.PC++;
        return 8;
      case 0x0F: {
        // RRCA
        const result = rotateRight8(this.#register.A);
        this.#register.flagZero = false;
        this.#register.flagSubtract = false;
        this.#register.flagHalfCarry = false;
        this.#register.flagCarry = (this.#register.A & 1) != 0;
        this.#register.A = result & 0xFF;
        return 4;
      }
      case 0x10:
        // STOP
        this.#register.PC++;
        return 4;
      case 0x11:
        // LD DE, n16
        this.#register.DE = this.#memory.readWord(this.#register.PC);
        this.#register.PC += 2;
        return 12;
      case 0x12:
        // LD (DE), A
        this.#memory.writeByte(this.#register.DE, this.#register.A);
        return 8;
      case 0x13:
        // INC DE
        this.#register.DE++;
        return 8;
      case 0x14:
        // INC D
        this.#inc8('D');
        return 4;
      case 0x15:
        // DEC D
        this.#dec8('D');
        return 4;
      case 0x16:
        // LD D, n8
        this.#register.D = this.#memory.readByte(this.#register.PC);
        this.#register.PC++;
        return 8;
      case 0x17:
        // RLA
        const [rotated, leftBit] = rotateThroughCarryLeft8(this.#register.A, this.#register.flagCarry);
        this.#register.A = rotated & 0xFF;
        this.#register.flagZero = false;
        this.#register.flagSubtract = false;
        this.#register.flagHalfCarry = false;
        this.#register.flagCarry = leftBit === 1;
        return 4;
      case 0x18:
        // JR e8
        this.#register.PC++;
        this.#jr();
        return 12;
      case 0x19: {
        // ADD HL, DE
        this.#add16('HL', 'DE');
        return 8;
      }
      case 0x1A:
        // LD A, (DE)
        this.#register.A = this.#memory.readByte(this.#register.DE);
        return 8;
      case 0x1B: {
        // DEC DE
        this.#register.DE--;
        return 8;
      }
      case 0x1C: {
        // INC E
        this.#inc8('E');
        return 4;
      }
      case 0x1D: {
        // DEC E
        this.#dec8('E');
        return 4;
      }
      case 0x1E:
        // LD E, n8
        this.#register.E = this.#memory.readByte(this.#register.PC);
        this.#register.PC++;
        return 8;
      case 0x1F: {
        // RRA
        const [rotated, rightBit] = rotateThroughCarryRight8(this.#register.A, this.#register.flagCarry);
        this.#register.A = rotated & 0xFF;
        this.#register.flagZero = false;
        this.#register.flagSubtract = false;
        this.#register.flagHalfCarry = false;
        this.#register.flagCarry = rightBit === 1;
        return 4;
      }
      case 0x20:
        // JR NZ, e8
        this.#register.PC++;
        if (!this.#register.flagZero) {
          this.#jr();
          return 12;
        }
        return 8;
      case 0x21:
        // LD HL, n16
        this.#register.HL = this.#memory.readWord(this.#register.PC);
        this.#register.PC += 2;
        return 12;
      case 0x22:
        // LD (HL+), A
        this.#memory.writeByte(this.#register.HL++, this.#register.A);
        return 8;
      case 0x23:
        // INC HL
        this.#register.HL++;
        return 8;
      case 0x24:
        // INC H
        this.#inc8('H');
        return 4;
      case 0x25:
        // DEC H
        this.#dec8('H');
        return 4;
      case 0x26:
        // LD H, n8
        this.#register.H = this.#memory.readByte(this.#register.PC);
        this.#register.PC++;
        return 8;
      case 0x27:
        // DAA
        // TODO: I am not sure I understand this instruction
        let result = 0;
        if (this.#register.flagHalfCarry || (result & 0xf) > 0x09) {
          result += this.#register.flagSubtract ? -0x06 : 0x06;
        }
        if (this.#register.flagCarry || result >> 4 > 0x09) {
          result += this.#register.flagSubtract ? -0x06 : 0x06;
        }
        this.#register.flagZero = this.#register.A === 0;
        this.#register.flagHalfCarry = false;
        this.#register.flagCarry = this.#register.flagCarry || result > 0xff;
        this.#register.A = result & 0xff;
        return 4;
      case 0x28:
        // JR Z, e8
        this.#register.PC++;
        if (this.#register.flagZero) {
          this.#jr();
          return 12;
        }
        return 8;
      case 0x29: {
        // ADD HL, HL
        this.#add16('HL', 'HL');
        return 8;
      }
      case 0x2A:
        // LD A, (HL+)
        this.#register.A = this.#memory.readByte(this.#register.HL++);
        return 8;
      case 0x2B: {
        // DEC HL
        this.#register.HL--;
        return 8;
      }
      case 0x2C: {
        // INC L
        this.#inc8('L');
        return 4;
      }
      case 0x2D: {
        // DEC L
        this.#dec8('L');
        return 4;
      }
      case 0x2E:
        // LD L, n8
        this.#register.L = this.#memory.readByte(this.#register.PC);
        this.#register.PC++;
        return 8;
      case 0x2F:
        // CPL
        this.#register.A = ~this.#register.A & 0xFF;
        this.#register.flagSubtract = true;
        this.#register.flagHalfCarry = true;
        return 4;
      case 0x30:
        // JR NC, e8
        this.#register.PC++;
        if (!this.#register.flagCarry) {
          this.#jr();
          return 12;
        }
        return 8;
      case 0x31:
        // LD SP, n16
        this.#register.SP = this.#memory.readWord(this.#register.PC);
        this.#register.PC += 2;
        return 12;
      case 0x32:
        // LD (HL-), A
        this.#memory.writeByte(this.#register.HL--, this.#register.A);
        return 8;
      case 0x33:
        // INC SP
        this.#register.SP++;
        return 8;
      case 0x34:
        // INC (HL)
        this.#inc8ref(this.#register.HL);
        return 12;
      case 0x35:
        // DEC (HL)
        this.#dec8ref(this.#register.HL);
        return 12;
      case 0x36:
        // LD (HL), n8
        this.#memory.writeByte(this.#register.HL, this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 12;
      case 0x37:
        // SCF
        this.#register.flagSubtract = false;
        this.#register.flagHalfCarry = false;
        this.#register.flagCarry = true;
        return 4;
      case 0x38:
        // JR C, e8
        this.#register.PC++;
        if (this.#register.flagCarry) {
          this.#jr();
          return 12;
        }
        return 8;
      case 0x39: {
        // ADD HL, SP
        this.#add16('HL', 'SP');
        return 8;
      }
      case 0x3A:
        // LD A, (HL-)
        this.#register.A = this.#memory.readByte(this.#register.HL--);
        return 8;
      case 0x3B: {
        // DEC SP
        this.#register.SP--;
        return 8;
      }
      case 0x3C: {
        // INC A
        this.#inc8('A');
        return 4;
      }
      case 0x3D: {
        // DEC A
        this.#dec8('A');
        return 4;
      }
      case 0x3E:
        // LD A, n8
        this.#register.A = this.#memory.readByte(this.#register.PC);
        this.#register.PC++;
        return 8;
      case 0x3F:
        // CCF
        this.#register.flagSubtract = false;
        this.#register.flagHalfCarry = false;
        this.#register.flagCarry = !this.#register.flagCarry;
        return 4;
      case 0x40:
        // LD B, B
        return 4;
      case 0x41:
        // LD B, C
        this.#register.B = this.#register.C;
        return 4;
      case 0x42:
        // LD B, D
        this.#register.B = this.#register.D;
        return 4;
      case 0x43:
        // LD B, E
        this.#register.B = this.#register.E;
        return 4;
      case 0x44:
        // LD B, H
        this.#register.B = this.#register.H;
        return 4;
      case 0x45:
        // LD B, L
        this.#register.B = this.#register.L;
        return 4;
      case 0x46:
        // LD B, (HL)
        this.#register.B = this.#memory.readByte(this.#register.HL);
        return 8;
      case 0x47:
        // LD B, A
        this.#register.B = this.#register.A;
        return 4;
      case 0x48:
        // LD C, B
        this.#register.C = this.#register.B;
        return 4;
      case 0x49:
        // LD C, C
        return 4;
      case 0x4A:
        // LD C, D
        this.#register.C = this.#register.D;
        return 4;
      case 0x4B:
        // LD C, E
        this.#register.C = this.#register.E;
        return 4;
      case 0x4C:
        // LD C, H
        this.#register.C = this.#register.H;
        return 4;
      case 0x4D:
        // LD C, L
        this.#register.C = this.#register.L;
        return 4;
      case 0x4E:
        // LD C, (HL)
        this.#register.C = this.#memory.readByte(this.#register.HL);
        return 8;
      case 0x4F:
        // LD C, A
        this.#register.C = this.#register.A;
        return 4;
      case 0x50:
        // LD D, B
        this.#register.D = this.#register.B;
        return 4;
      case 0x51:
        // LD D, C
        this.#register.D = this.#register.C;
        return 4;
      case 0x52:
        // LD D, D
        return 4;
      case 0x53:
        // LD D, E
        this.#register.D = this.#register.E;
        return 4;
      case 0x54:
        // LD D, H
        this.#register.D = this.#register.H;
        return 4;
      case 0x55:
        // LD D, L
        this.#register.D = this.#register.L;
        return 4;
      case 0x56:
        // LD D, (HL)
        this.#register.D = this.#memory.readByte(this.#register.HL);
        return 8;
      case 0x57:
        // LD D, A
        this.#register.D = this.#register.A;
        return 4;
      case 0x58:
        // LD E, B
        this.#register.E = this.#register.B;
        return 4;
      case 0x59:
        // LD E, C
        this.#register.E = this.#register.C;
        return 4;
      case 0x5A:
        // LD E, D
        this.#register.E = this.#register.D;
        return 4;
      case 0x5B:
        // LD E, E
        return 4;
      case 0x5C:
        // LD E, H
        this.#register.E = this.#register.H;
        return 4;
      case 0x5D:
        // LD E, L
        this.#register.E = this.#register.L;
        return 4;
      case 0x5E:
        // LD E, (HL)
        this.#register.E = this.#memory.readByte(this.#register.HL);
        return 8;
      case 0x5F:
        // LD E, A
        this.#register.E = this.#register.A;
        return 4;
      case 0x60:
        // LD H, B
        this.#register.H = this.#register.B;
        return 4;
      case 0x61:
        // LD H, C
        this.#register.H = this.#register.C;
        return 4;
      case 0x62:
        // LD H, D
        this.#register.H = this.#register.D;
        return 4;
      case 0x63:
        // LD H, E
        this.#register.H = this.#register.E;
        return 4;
      case 0x64:
        // LD H, H
        return 4;
      case 0x65:
        // LD H, L
        this.#register.H = this.#register.L;
        return 4;
      case 0x66:
        // LD H, (HL)
        this.#register.H = this.#memory.readByte(this.#register.HL);
        return 8;
      case 0x67:
        // LD H, A
        this.#register.H = this.#register.A;
        return 4;
      case 0x68:
        // LD L, B
        this.#register.L = this.#register.B;
        return 4;
      case 0x69:
        // LD L, C
        this.#register.L = this.#register.C;
        return 4;
      case 0x6A:
        // LD L, D
        this.#register.L = this.#register.D;
        return 4;
      case 0x6B:
        // LD L, E
        this.#register.L = this.#register.E;
        return 4;
      case 0x6C:
        // LD L, H
        this.#register.L = this.#register.H;
        return 4;
      case 0x6D:
        // LD L, L
        return 4;
      case 0x6E:
        // LD L, (HL)
        this.#register.L = this.#memory.readByte(this.#register.HL);
        return 8;
      case 0x6F:
        // LD L, A
        this.#register.L = this.#register.A;
        return 4;
      case 0x70:
        // LD (HL), B
        this.#memory.writeByte(this.#register.HL, this.#register.B);
        return 8;
      case 0x71:
        // LD (HL), C
        this.#memory.writeByte(this.#register.HL, this.#register.C);
        return 8;
      case 0x72:
        // LD (HL), D
        this.#memory.writeByte(this.#register.HL, this.#register.D);
        return 8;
      case 0x73:
        // LD (HL), E
        this.#memory.writeByte(this.#register.HL, this.#register.E);
        return 8;
      case 0x74:
        // LD (HL), H
        this.#memory.writeByte(this.#register.HL, this.#register.H);
        return 8;
      case 0x75:
        // LD (HL), L
        this.#memory.writeByte(this.#register.HL, this.#register.L);
        return 8;
      case 0x76:
        // HALT
        this.#halted = true;
        return 4;
      case 0x77:
        // LD (HL), A
        this.#memory.writeByte(this.#register.HL, this.#register.A);
        return 8;
      case 0x78:
        // LD A, B
        this.#register.A = this.#register.B;
        return 4;
      case 0x79:
        // LD A, C
        this.#register.A = this.#register.C;
        return 4;
      case 0x7A:
        // LD A, D
        this.#register.A = this.#register.D;
        return 4;
      case 0x7B:
        // LD A, E
        this.#register.A = this.#register.E;
        return 4;
      case 0x7C:
        // LD A, H
        this.#register.A = this.#register.H;
        return 4;
      case 0x7D:
        // LD A, L
        this.#register.A = this.#register.L;
        return 4;
      case 0x7E:
        // LD A, (HL)
        this.#register.A = this.#memory.readByte(this.#register.HL);
        return 8;
      case 0x7F:
        // LD A, A
        return 4;
      case 0x80:
        // ADD A, B
        this.#add8('A', 'B');
        return 4;
      case 0x81:
        // ADD A, C
        this.#add8('A', 'C');
        return 4;
      case 0x82:
        // ADD A, D
        this.#add8('A', 'D');
        return 4;
      case 0x83:
        // ADD A, E
        this.#add8('A', 'E');
        return 4;
      case 0x84:
        // ADD A, H
        this.#add8('A', 'H');
        return 4;
      case 0x85:
        // ADD A, L
        this.#add8('A', 'L');
        return 4;
      case 0x86:
        // ADD A, (HL)
        this.#add8val('A', this.#memory.readByte(this.#register.HL));
        return 8;
      case 0x87:
        // ADD A, A
        this.#add8('A', 'A');
        return 4;
      case 0x88:
        // ADC A, B
        this.#adc('A', 'B');
        return 4;
      case 0x89:
        // ADC A, C
        this.#adc('A', 'C');
        return 4;
      case 0x8A:
        // ADC A, D
        this.#adc('A', 'D');
        return 4;
      case 0x8B:
        // ADC A, E
        this.#adc('A', 'E');
        return 4;
      case 0x8C:
        // ADC A, H
        this.#adc('A', 'H');
        return 4;
      case 0x8D:
        // ADC A, L
        this.#adc('A', 'L');
        return 4;
      case 0x8E:
        // ADC A, (HL)
        this.#adcVal('A', this.#memory.readByte(this.#register.HL));
        return 8;
      case 0x8F:
        // ADC A, A
        this.#adc('A', 'A');
        return 4;
      case 0x90:
        // SUB A, B
        this.#sub('B');
        return 4;
      case 0x91:
        // SUB A, C
        this.#sub('C');
        return 4;
      case 0x92:
        // SUB A, D
        this.#sub('D');
        return 4;
      case 0x93:
        // SUB A, E
        this.#sub('E');
        return 4;
      case 0x94:
        // SUB A, H
        this.#sub('H');
        return 4;
      case 0x95:
        // SUB A, L
        this.#sub('L');
        return 4;
      case 0x96:
        // SUB A, (HL)
        this.#subVal(this.#memory.readByte(this.#register.HL));
        return 8;
      case 0x97:
        // SUB A, A
        this.#sub('A');
        return 4;
      case 0x98:
        // SBC A, B
        this.#sbc('B');
        return 4;
      case 0x99:
        // SBC A, C
        this.#sbc('C');
        return 4;
      case 0x9A:
        // SBC A, D
        this.#sbc('D');
        return 4;
      case 0x9B:
        // SBC A, E
        this.#sbc('E');
        return 4;
      case 0x9C:
        // SBC A, H
        this.#sbc('H');
        return 4;
      case 0x9D:
        // SBC A, L
        this.#sbc('L');
        return 4;
      case 0x9E:
        // SBC A, (HL)
        this.#sbcVal(this.#memory.readByte(this.#register.HL));
        return 8;
      case 0x9F:
        // SBC A, A
        this.#sbc('A');
        return 4;
      case 0xA0:
        // AND A, B
        this.#and(this.#register.B);
        return 4;
      case 0xA1:
        // AND A, C
        this.#and(this.#register.C);
        return 4;
      case 0xA2:
        // AND A, D
        this.#and(this.#register.D);
        return 4;
      case 0xA3:
        // AND A, E
        this.#and(this.#register.E);
        return 4;
      case 0xA4:
        // AND A, H
        this.#and(this.#register.H);
        return 4;
      case 0xA5:
        // AND A, L
        this.#and(this.#register.L);
        return 4;
      case 0xA6:
        // AND A, (HL)
        this.#and(this.#memory.readByte(this.#register.HL));
        return 8;
      case 0xA7:
        // AND A, A
        this.#and(this.#register.A);
        return 4;
      case 0xA8:
        // XOR A, B
        this.#xor(this.#register.B);
        return 4;
      case 0xA9:
        // XOR A, C
        this.#xor(this.#register.C);
        return 4;
      case 0xAA:
        // XOR A, D
        this.#xor(this.#register.D);
        return 4;
      case 0xAB:
        // XOR A, E
        this.#xor(this.#register.E);
        return 4;
      case 0xAC:
        // XOR A, H
        this.#xor(this.#register.H);
        return 4;
      case 0xAD:
        // XOR A, L
        this.#xor(this.#register.L);
        return 4;
      case 0xAE:
        // XOR A, (HL)
        this.#xor(this.#memory.readByte(this.#register.HL));
        return 8;
      case 0xAF:
        // XOR A, A
        this.#xor(this.#register.A);
        return 4;
      case 0xB0:
        // OR A, B
        this.#or(this.#register.B);
        return 4;
      case 0xB1:
        // OR A, C
        this.#or(this.#register.C);
        return 4;
      case 0xB2:
        // OR A, D
        this.#or(this.#register.D);
        return 4;
      case 0xB3:
        // OR A, E
        this.#or(this.#register.E);
        return 4;
      case 0xB4:
        // OR A, H
        this.#or(this.#register.H);
        return 4;
      case 0xB5:
        // OR A, L
        this.#or(this.#register.L);
        return 4;
      case 0xB6:
        // OR A, (HL)
        this.#or(this.#memory.readByte(this.#register.HL));
        return 8;
      case 0xB7:
        // OR A, A
        this.#or(this.#register.A);
        return 4;
      case 0xB8:
        // CP A, B
        this.#cp(this.#register.B);
        return 4;
      case 0xB9:
        // CP A, C
        this.#cp(this.#register.C);
        return 4;
      case 0xBA:
        // CP A, D
        this.#cp(this.#register.D);
        return 4;
      case 0xBB:
        // CP A, E
        this.#cp(this.#register.E);
        return 4;
      case 0xBC:
        // CP A, H
        this.#cp(this.#register.H);
        return 4;
      case 0xBD:
        // CP A, L
        this.#cp(this.#register.L);
        return 4;
      case 0xBE:
        // CP A, (HL)
        this.#cp(this.#memory.readByte(this.#register.HL));
        return 8;
      case 0xBF:
        // CP A, A
        this.#cp(this.#register.A);
        return 4;
      case 0xC0:
        // RET NZ
        if (!this.#register.flagZero) {
          this.#register.PC = this.#memory.readWord(this.#register.SP);
          this.#register.SP += 2;
          return 20;
        }
        return 8;
      case 0xC1:
        // POP BC
        this.#register.BC = this.#memory.readWord(this.#register.SP);
        this.#register.SP += 2;
        return 12;
      case 0xC2:
        // JP NZ, a16
        if (!this.#register.flagZero) {
          this.#register.PC = this.#memory.readWord(this.#register.PC);
          return 16;
        }
        this.#register.PC += 2;
        return 12;
      case 0xC3:
        // JP a16
        this.#register.PC = this.#memory.readWord(this.#register.PC);
        return 16;
      case 0xC4:
        // CALL NZ, a16
        if (!this.#register.flagZero) {
          this.#call(this.#memory.readWord(this.#register.PC));
          return 24;
        }
        this.#register.PC += 2;
        return 12;
      case 0xC5:
        // PUSH BC
        this.#push(this.#register.BC);
        return 16;
      case 0xC6:
        // ADD A, n8
        this.#add8val('A', this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 8;
      case 0xC7:
        // RST 00H
        this.#call(0x0000); // Not a mistake, it's the same as CALL 0x00
        return 16;
      case 0xC8:
        // RET Z
        if (this.#register.flagZero) {
          this.#register.PC = this.#pop();
          return 20;
        }
        return 8;
      case 0xC9:
        // RET
        this.#register.PC = this.#pop();
        return 16;
      case 0xCA:
        // JP Z, a16
        if (this.#register.flagZero) {
          this.#register.PC = this.#memory.readWord(this.#register.PC);
          return 16;
        }
        this.#register.PC += 2;
        return 12;
      case 0xCB:
        // PREFIX CB
        return this.#executeCB();
      case 0xCC:
        // CALL Z, a16
        if (this.#register.flagZero) {
          this.#call(this.#memory.readWord(this.#register.PC));
          return 24;
        }
        this.#register.PC += 2;
        return 12;
      case 0xCD:
        // CALL a16
        this.#call(this.#memory.readWord(this.#register.PC));
        return 24;
      case 0xCE:
        // ADC A, n8
        this.#adcVal('A', this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 8;
      case 0xCF:
        // RST 08H
        this.#call(0x0008); // Not a mistake, it's the same as CALL 0x08
        return 16;
      case 0xD0:
        // RET NC
        if (!this.#register.flagCarry) {
          this.#register.PC = this.#pop();
          return 20;
        }
        return 8;
      case 0xD1:
        // POP DE
        this.#register.DE = this.#pop();
        return 12;
      case 0xD2:
        // JP NC, a16
        if (!this.#register.flagCarry) {
          this.#register.PC = this.#memory.readWord(this.#register.PC);
          return 16;
        }
        this.#register.PC += 2;
        return 12;
      case 0xD3:
        throw new Error('Illegal instruction 0xD3');
      case 0xD4:
        // CALL NC, a16
        if (!this.#register.flagCarry) {
          this.#call(this.#memory.readWord(this.#register.PC));
          return 24;
        }
        this.#register.PC += 2;
        return 12;
      case 0xD5:
        // PUSH DE
        this.#push(this.#register.DE);
        return 16;
      case 0xD6:
        // SUB A, n8
        this.#subVal(this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 8;
      case 0xD7:
        // RST 10H
        this.#call(0x0010); // Not a mistake, it's the same as CALL 0x10
        return 16;
      case 0xD8:
        // RET C
        if (this.#register.flagCarry) {
          this.#register.PC = this.#pop();
          return 20;
        }
        return 8;
      case 0xD9:
        // RETI
        this.#register.PC = this.#pop();
        this.#interrupts.allowInterrupts = true;
        return 16;
      case 0xDA:
        // JP C, a16
        if (this.#register.flagCarry) {
          this.#register.PC = this.#memory.readWord(this.#register.PC);
          return 16;
        }
        this.#register.PC += 2;
        return 12;
      case 0xDB:
        throw new Error('Illegal instruction 0xDB');
      case 0xDC:
        // CALL C, a16
        if (this.#register.flagCarry) {
          this.#call(this.#memory.readWord(this.#register.PC));
          return 24;
        }
        this.#register.PC += 2;
        return 12;
      case 0xDD:
        throw new Error('Illegal instruction 0xDD');
      case 0xDE:
        // SBC A, n8
        this.#sbcVal(this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 8;
      case 0xDF:
        // RST 18H
        this.#call(0x0018); // Not a mistake, it's the same as CALL 0x18
        return 16;
      case 0xE0:
        // LDH (n8), A
        this.#memory.writeByte(0xFF00 + this.#memory.readByte(this.#register.PC), this.#register.A);
        this.#register.PC++;
        return 12;
      case 0xE1:
        // POP HL
        this.#register.HL = this.#pop();
        return 12;
      case 0xE2:
        // LD (C), A
        this.#memory.writeByte(0xFF00 + this.#register.C, this.#register.A);
        return 8;
      case 0xE3:
        throw new Error('Illegal instruction 0xE3');
      case 0xE4:
        throw new Error('Illegal instruction 0xE4');
      case 0xE5:
        // PUSH HL
        this.#push(this.#register.HL);
        return 16;
      case 0xE6:
        // AND A, n8
        this.#and(this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 8;
      case 0xE7:
        // RST 20H
        this.#call(0x0020); // Not a mistake, it's the same as CALL 0x20
        return 16;
      case 0xE8: {
        // ADD SP, e8
        const value = this.#memory.readByte(this.#register.PC, true);
        const result = (this.#register.SP + value);
        this.#register.flagZero = false;
        this.#register.flagSubtract = false;
        this.#register.flagCarry = (result & 0xFF) + (this.#register.SP & 0xFF) > 0xFF;
        this.#register.flagHalfCarry = isHalfCarry8(this.#register.SP, value);
        this.#register.SP = result & 0xFFFF;
        return 16;
      }
      case 0xE9:
        // JP HL
        this.#register.PC = this.#register.HL;
        return 4;
      case 0xEA:
        // LD (a16), A
        this.#memory.writeByte(this.#memory.readWord(this.#register.PC), this.#register.A);
        this.#register.PC += 2;
        return 16;
      case 0xEB:
        throw new Error('Illegal instruction 0xEB');
      case 0xEC:
        throw new Error('Illegal instruction 0xEC');
      case 0xED:
        throw new Error('Illegal instruction 0xED');
      case 0xEE:
        // XOR A, n8
        this.#xor(this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 8;
      case 0xEF:
        // RST 28H
        this.#call(0x0028); // Not a mistake, it's the same as CALL 0x28
        return 16;
      case 0xF0:
        // LDH A, (n8)
        this.#register.A = this.#memory.readByte(0xFF00 + this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 12;
      case 0xF1:
        // POP AF
        this.#register.AF = this.#pop();
        return 12;
      case 0xF2:
        // LD A, (C)
        this.#register.A = this.#memory.readByte(0xFF00 + this.#register.C);
        return 8;
      case 0xF3:
        // DI
        this.#interrupts.allowInterrupts = false;
        return 4;
      case 0xF4:
        throw new Error('Illegal instruction 0xF4');
      case 0xF5:
        // PUSH AF
        this.#push(this.#register.AF);
        return 16;
      case 0xF6:
        // OR A, n8
        this.#or(this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 8;
      case 0xF7:
        // RST 30H
        this.#call(0x0030); // Not a mistake, it's the same as CALL 0x30
        return 16;
      case 0xF8: {
        // LD HL, SP + e8
        const value = this.#memory.readByte(this.#register.PC, true);
        const result = this.#register.SP + value;
        this.#register.flagZero = false;
        this.#register.flagSubtract = false;
        this.#register.flagCarry = (result & 0xFF) + (this.#register.SP & 0xFF) > 0xFF;
        this.#register.flagHalfCarry = isHalfCarry8(this.#register.SP, value);
        this.#register.HL = result & 0xFFFF;
        return 12;
      }
      case 0xF9:
        // LD SP, HL
        this.#register.SP = this.#register.HL;
        return 8;
      case 0xFA:
        // LD A, (a16)
        this.#register.A = this.#memory.readByte(this.#memory.readWord(this.#register.PC));
        this.#register.PC += 2;
        return 16;
      case 0xFB:
        // EI
        this.#interrupts.allowInterrupts = true;
        return 4;
      case 0xFC:
        throw new Error('Illegal instruction 0xFC');
      case 0xFD:
        throw new Error('Illegal instruction 0xFD');
      case 0xFE:
        // CP A, n8
        this.#cp(this.#memory.readByte(this.#register.PC));
        this.#register.PC++;
        return 8;
      case 0xFF:
        // RST 38H
        this.#call(0x0038); // Not a mistake, it's the same as CALL 0x38
        return 16;
      default:
        throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
    }

  }

  #executeCB() {
    const opcode = this.#memory.readByte(this.#register.PC);
    throw new Error('Not implemented');
    return 0;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #inc8(r8) {
    const result = this.#register[r8] + 1
    this.#register.flagZero = (result & 0xFF) == 0
    this.#register.flagSubtract = false
    this.#register.flagHalfCarry = isHalfCarry8(this.#register[r8], 1)
    this.#register[r8] = result & 0xFF
  }

  /**
   * @param {number} ref
   */
  #inc8ref(ref) {
    const value = this.#memory.readByte(ref) + 1;
    this.#register.flagZero = (value & 0xFF) == 0;
    this.#register.flagSubtract = false;
    this.#register.flagHalfCarry = isHalfCarry8(value, 1);
    this.#memory.writeByte(ref, value);
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #dec8(r8) {
    const result = this.#register[r8] + 1
    this.#register.flagZero = (result & 0xFF) == 0
    this.#register.flagSubtract = false
    this.#register.flagHalfCarry = isHalfBorrow8(this.#register[r8], 1)
    this.#register[r8] = result & 0xFF
  }

  /**
   * @param {number} ref
   */
  #dec8ref(ref) {
    const value = this.#memory.readByte(ref) - 1;
    this.#register.flagZero = (value & 0xFF) == 0;
    this.#register.flagSubtract = true;
    this.#register.flagHalfCarry = isHalfBorrow8(value, 1);
    this.#memory.writeByte(ref, value);
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} s8
   */
  #add8(r8, s8) {
    const result = this.#register[r8] + this.#register[s8]
    this.#register.flagZero = (result & 0xFF) == 0
    this.#register.flagSubtract = false
    this.#register.flagHalfCarry = isHalfCarry8(this.#register[r8], this.#register[s8])
    this.#register.flagCarry = result > 0xFF
    this.#register[r8] = result & 0xFF
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   * @param {number} value
   */
  #add8val(r8, value) {
    const result = this.#register[r8] + value;
    this.#register.flagZero = (result & 0xFF) == 0;
    this.#register.flagSubtract = false;
    this.#register.flagHalfCarry = isHalfCarry8(this.#register[r8], value);
    this.#register.flagCarry = result > 0xFF;
    this.#register[r8] = result & 0xFF;
  }

  /**
   * @param  {'HL' | 'BC' | 'DE' | 'HL' | 'SP'} r16
   * @param  {'HL' | 'BC' | 'DE' | 'HL' | 'SP'} s16
   */
  #add16(r16, s16) {
    const result = this.#register[r16] + this.#register[s16]
    this.#register.flagSubtract = false
    this.#register.flagHalfCarry = isHalfCarry16(this.#register[r16], this.#register[s16])
    this.#register.flagCarry = result > 0xFFFF
    this.#register[r16] = result & 0xFFFF
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} s8
   */
  #adc(r8, s8) {
    const result = this.#register[r8] + this.#register[s8] + +this.#register.flagCarry
    this.#register.flagZero = (result & 0xFF) == 0
    this.#register.flagSubtract = false
    this.#register.flagHalfCarry = isHalfCarry8(this.#register[r8], this.#register[s8] + +this.#register.flagCarry)
    this.#register.flagCarry = result > 0xFF
    this.#register[r8] = result & 0xFF
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #sbc(r8) {
    const result = this.#register.A - this.#register[r8] - +this.#register.flagCarry;
    this.#register.flagZero = (result & 0xFF) == 0;
    this.#register.flagSubtract = true;
    this.#register.flagHalfCarry = isHalfBorrow8(this.#register.A, this.#register[r8] + +this.#register.flagCarry);
    this.#register.flagCarry = result < 0;
    this.#register.A = result & 0xFF;
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   * @param  {number} value
   */
  #adcVal(r8, value) {
    const result = this.#register[r8] + value + +this.#register.flagCarry;
    this.#register.flagZero = (result & 0xFF) == 0;
    this.#register.flagSubtract = false;
    this.#register.flagHalfCarry = isHalfCarry8(this.#register[r8], value + +this.#register.flagCarry);
    this.#register.flagCarry = result > 0xFF;
    this.#register[r8] = result & 0xFF;
  }

  /**
   * @param {number} value
   */
  #sbcVal(value) {
    const result = this.#register.A - value - +this.#register.flagCarry;
    this.#register.flagZero = (result & 0xFF) == 0;
    this.#register.flagSubtract = true;
    this.#register.flagHalfCarry = isHalfBorrow8(this.#register.A, value + +this.#register.flagCarry);
    this.#register.flagCarry = result < 0;
    this.#register.A = result & 0xFF;
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #sub(r8) {
    const result = this.#register.A - this.#register[r8];
    this.#register.flagZero = (result & 0xFF) == 0;
    this.#register.flagSubtract = true;
    this.#register.flagHalfCarry = isHalfBorrow8(this.#register.A, this.#register[r8]);
    this.#register.flagCarry = result < 0;
    this.#register.A = result & 0xFF;
  }

  /**
   * @param  {number} value
   */
  #subVal(value) {
    const result = this.#register.A - value;
    this.#register.flagZero = (result & 0xFF) == 0;
    this.#register.flagSubtract = true;
    this.#register.flagHalfCarry = isHalfBorrow8(this.#register.A, value);
    this.#register.flagCarry = result < 0;
    this.#register.A = result & 0xFF;
  }

  #jr() {
    const offset = this.#memory.readByte(this.#register.PC, true);
    this.#register.PC = (this.#register.PC + offset) & 0xFFFF;
  }

  /**
   * @param {number} val
   */
  #and(val) {
    this.#register.A &= this.#register[val];
    this.#register.flagZero = this.#register.A === 0;
    this.#register.flagSubtract = false;
    this.#register.flagHalfCarry = true;
    this.#register.flagCarry = false;
  }

  /**
   * @param {number} val
   */
  #or(val) {
    this.#register.A |= this.#register[val];
    this.#register.flagZero = this.#register.A === 0;
    this.#register.flagSubtract = false;
    this.#register.flagHalfCarry = false;
    this.#register.flagCarry = false;
  }

  /**
   * @param {number} val
   */
  #xor(val) {
    this.#register.A ^= this.#register[val];
    this.#register.flagZero = this.#register.A === 0;
    this.#register.flagSubtract = false;
    this.#register.flagHalfCarry = false;
    this.#register.flagCarry = false;
  }

  /**
   * @param {number} val
   */
  #cp(val) {
    const result = this.#register.A - val;
    this.#register.flagZero = (result & 0xFF) == 0;
    this.#register.flagSubtract = true;
    this.#register.flagHalfCarry = isHalfBorrow8(this.#register.A, val);
    this.#register.flagCarry = result < 0;
  }

  /**
   * @param {number} val
   */
  #push(val) {
    this.#register.SP -= 2;
    this.#memory.writeWord(this.#register.SP, val);
  }

  /**
   * @param {number} val
   */
  #call(val) {
    this.#push(this.#register.PC);
    this.#register.PC = val;
  }

  #pop() {
    const val = this.#memory.readWord(this.#register.SP);
    this.#register.SP += 2;
    return val;
  }
}

export { CPU };