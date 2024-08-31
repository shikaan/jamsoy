// @ts-check

import {
  rotateLeft8,
  isHalfBorrow8,
  isHalfCarry16,
  isHalfCarry8,
  readBit,
  rotateRight8,
  rotateThroughCarryLeft8,
  rotateThroughCarryRight8,
  shiftLeft8,
  shiftRight8,
} from "../utils/bits.mjs";
import { format } from "../utils/format.mjs";
import { DIVIDER_ADDRESS } from "../timer.mjs";

class CPU {
  static CLOCK_SPEED = 4194304; // Clock cycles per second
  static CYCLES_PER_FRAME = CPU.CLOCK_SPEED / 60; // CLOCK_SPEED / 60 frames per second

  // Set to true to enable debug mode
  debug = false;

  #registers;
  #memory;
  #interrupts;
  #decoder;

  #halted = false;
  #haltBugMode = false;

  /**
   * @param {import("../types").Memory} memory
   * @param {import("../types").CPURegisters} registers
   * @param {import("../types").Interrupts} interrupts
   * @param {import("../types").Decoder} [decoder]
   */
  constructor(memory, registers, interrupts, decoder) {
    this.#registers = registers;
    this.#memory = memory;
    this.#interrupts = interrupts;
    this.#decoder = decoder;
  }

  initialize() {
    this.#halted = false;
    this.#registers.initialize();
    this.#interrupts.enableInterrupts(false);

    // DMG Power Up Sequence
    this.#registers.PC = 0x0100;
    this.#registers.SP = 0xfffe;
    this.#registers.AF = 0x01b0;
    this.#registers.BC = 0x0013;
    this.#registers.DE = 0x00d8;
    this.#registers.HL = 0x014d;
  }

  executeNextIntruction() {
    if (this.#halted) {
      this.#halted = !this.#interrupts.hasPendingInterrupts();
      return 4;
    }

    const pc = this.#registers.PC;
    const opcode = this.#memory.readByte(pc);

    if (this.debug) {
      const instruction = this.#decoder?.decode(opcode);
      console.log(format.debug(pc, instruction, opcode));
    }

    return this.#execute(opcode);
  }

  /**
   * @returns {number} The number of tCycles the instruction took
   */
  #execute(opcode) {
    this.#incrementPC();
    switch (opcode) {
      case 0x00:
        // NOP
        return 4;
      case 0x01:
        // LD BC, n16
        this.#registers.BC = this.#memory.readWord(this.#registers.PC);
        this.#registers.PC += 2;
        return 12;
      case 0x02:
        // LD (BC), A
        this.#memory.writeByte(this.#registers.BC, this.#registers.A);
        return 8;
      case 0x03:
        // INC BC
        this.#registers.BC++;
        return 8;
      case 0x04: {
        // INC B
        this.#inc8("B");
        return 4;
      }
      case 0x05: {
        // DEC B
        this.#dec8("B");
        return 4;
      }
      case 0x06:
        // LD B, n8
        this.#registers.B = this.#memory.readByte(this.#registers.PC);
        this.#registers.PC++;
        return 8;
      case 0x07: {
        // RLCA
        const result = rotateLeft8(this.#registers.A);
        this.#registers.flagZero = false;
        this.#registers.flagSubtract = false;
        this.#registers.flagHalfCarry = false;
        this.#registers.flagCarry = (this.#registers.A & 0b10000000) != 0;
        this.#registers.A = result & 0xff;
        return 4;
      }
      case 0x08:
        // LD (a16), SP
        this.#memory.writeWord(
          this.#memory.readWord(this.#registers.PC),
          this.#registers.SP,
        );
        this.#registers.PC += 2;
        return 20;
      case 0x09: {
        // ADD HL, BC
        this.#add16("HL", "BC");
        return 8;
      }
      case 0x0a:
        // LD A, (BC)
        this.#registers.A = this.#memory.readByte(this.#registers.BC);
        return 8;
      case 0x0b: {
        // DEC BC
        this.#registers.BC--;
        return 8;
      }
      case 0x0c: {
        // INC C
        this.#inc8("C");
        return 4;
      }
      case 0x0d: {
        // DEC C
        this.#dec8("C");
        return 4;
      }
      case 0x0e: {
        // LD C, n8
        this.#registers.C = this.#memory.readByte(this.#registers.PC);
        this.#registers.PC++;
        return 8;
      }
      case 0x0f: {
        // RRCA
        const result = rotateRight8(this.#registers.A);
        this.#registers.flagZero = false;
        this.#registers.flagSubtract = false;
        this.#registers.flagHalfCarry = false;
        this.#registers.flagCarry = (this.#registers.A & 1) != 0;
        this.#registers.A = result & 0xff;
        return 4;
      }
      case 0x10:
        // STOP
        this.#memory.writeByte(DIVIDER_ADDRESS, 0); // Reset divider register
        this.#registers.PC++;
        return 0;
      case 0x11:
        // LD DE, n16
        this.#registers.DE = this.#memory.readWord(this.#registers.PC);
        this.#registers.PC += 2;
        return 12;
      case 0x12:
        // LD (DE), A
        this.#memory.writeByte(this.#registers.DE, this.#registers.A);
        return 8;
      case 0x13:
        // INC DE
        this.#registers.DE++;
        return 8;
      case 0x14:
        // INC D
        this.#inc8("D");
        return 4;
      case 0x15:
        // DEC D
        this.#dec8("D");
        return 4;
      case 0x16:
        // LD D, n8
        this.#registers.D = this.#memory.readByte(this.#registers.PC);
        this.#registers.PC++;
        return 8;
      case 0x17:
        // RLA
        const [rotated, leftBit] = rotateThroughCarryLeft8(
          this.#registers.A,
          this.#registers.flagCarry,
        );
        this.#registers.A = rotated & 0xff;
        this.#registers.flagZero = false;
        this.#registers.flagSubtract = false;
        this.#registers.flagHalfCarry = false;
        this.#registers.flagCarry = leftBit === 1;
        return 4;
      case 0x18:
        // JR e8
        this.#jr();
        return 12;
      case 0x19: {
        // ADD HL, DE
        this.#add16("HL", "DE");
        return 8;
      }
      case 0x1a:
        // LD A, (DE)
        this.#registers.A = this.#memory.readByte(this.#registers.DE);
        return 8;
      case 0x1b: {
        // DEC DE
        this.#registers.DE--;
        return 8;
      }
      case 0x1c: {
        // INC E
        this.#inc8("E");
        return 4;
      }
      case 0x1d: {
        // DEC E
        this.#dec8("E");
        return 4;
      }
      case 0x1e:
        // LD E, n8
        this.#registers.E = this.#memory.readByte(this.#registers.PC);
        this.#registers.PC++;
        return 8;
      case 0x1f: {
        // RRA
        const [rotated, rightBit] = rotateThroughCarryRight8(
          this.#registers.A,
          this.#registers.flagCarry,
        );
        this.#registers.A = rotated & 0xff;
        this.#registers.flagZero = false;
        this.#registers.flagSubtract = false;
        this.#registers.flagHalfCarry = false;
        this.#registers.flagCarry = rightBit === 1;
        return 4;
      }
      case 0x20:
        // JR NZ, e8
        if (!this.#registers.flagZero) {
          this.#jr();
          return 12;
        }
        this.#registers.PC++;
        return 8;
      case 0x21:
        // LD HL, n16
        this.#registers.HL = this.#memory.readWord(this.#registers.PC);
        this.#registers.PC += 2;
        return 12;
      case 0x22:
        // LD (HL+), A
        this.#memory.writeByte(this.#registers.HL, this.#registers.A & 0xff);
        this.#registers.HL++;
        return 8;
      case 0x23:
        // INC HL
        this.#registers.HL++;
        return 8;
      case 0x24:
        // INC H
        this.#inc8("H");
        return 4;
      case 0x25:
        // DEC H
        this.#dec8("H");
        return 4;
      case 0x26:
        // LD H, n8
        this.#registers.H = this.#memory.readByte(this.#registers.PC);
        this.#registers.PC++;
        return 8;
      case 0x27: {
        // DAA
        let t = this.#registers.A;
        let correction = 0;
        if (this.#registers.flagHalfCarry) correction |= 0x06;
        if (this.#registers.flagCarry) correction |= 0x60;

        if (this.#registers.flagSubtract) {
          t = (t - correction) & 0xff;
        } else {
          if ((t & 0x0f) > 0x09) correction |= 0x06;
          if (t > 0x99) correction |= 0x60;
          t = (t + correction) & 0xff;
        }
        this.#registers.A = t;
        this.#registers.flagZero = t === 0;
        this.#registers.flagHalfCarry = false;
        this.#registers.flagCarry = (correction & 0x60) !== 0;
        return 4;
      }
      case 0x28:
        // JR Z, e8
        if (this.#registers.flagZero) {
          this.#jr();
          return 12;
        }
        this.#registers.PC++;
        return 8;
      case 0x29: {
        // ADD HL, HL
        this.#add16("HL", "HL");
        return 8;
      }
      case 0x2a:
        // LD A, (HL+)
        this.#registers.A = this.#memory.readByte(this.#registers.HL++);
        return 8;
      case 0x2b: {
        // DEC HL
        this.#registers.HL--;
        return 8;
      }
      case 0x2c: {
        // INC L
        this.#inc8("L");
        return 4;
      }
      case 0x2d: {
        // DEC L
        this.#dec8("L");
        return 4;
      }
      case 0x2e:
        // LD L, n8
        this.#registers.L = this.#memory.readByte(this.#registers.PC);
        this.#registers.PC++;
        return 8;
      case 0x2f:
        // CPL
        this.#registers.A = ~this.#registers.A & 0xff;
        this.#registers.flagSubtract = true;
        this.#registers.flagHalfCarry = true;
        return 4;
      case 0x30:
        // JR NC, e8
        if (!this.#registers.flagCarry) {
          this.#jr();
          return 12;
        }
        this.#registers.PC++;
        return 8;
      case 0x31:
        // LD SP, n16
        this.#registers.SP = this.#memory.readWord(this.#registers.PC);
        this.#registers.PC += 2;
        return 12;
      case 0x32:
        // LD (HL-), A
        this.#memory.writeByte(this.#registers.HL, this.#registers.A & 0xff);
        this.#registers.HL--;
        return 8;
      case 0x33:
        // INC SP
        this.#registers.SP++;
        return 8;
      case 0x34:
        // INC (HL)
        this.#inc8ref(this.#registers.HL);
        return 12;
      case 0x35:
        // DEC (HL)
        this.#dec8ref(this.#registers.HL);
        return 12;
      case 0x36:
        // LD (HL), n8
        this.#memory.writeByte(
          this.#registers.HL,
          this.#memory.readByte(this.#registers.PC),
        );
        this.#registers.PC++;
        return 12;
      case 0x37:
        // SCF
        this.#registers.flagSubtract = false;
        this.#registers.flagHalfCarry = false;
        this.#registers.flagCarry = true;
        return 4;
      case 0x38:
        // JR C, e8
        if (this.#registers.flagCarry) {
          this.#jr();
          return 12;
        }
        this.#registers.PC++;
        return 8;
      case 0x39: {
        // ADD HL, SP
        this.#add16("HL", "SP");
        return 8;
      }
      case 0x3a:
        // LD A, (HL-)
        this.#registers.A = this.#memory.readByte(this.#registers.HL--);
        return 8;
      case 0x3b: {
        // DEC SP
        this.#registers.SP--;
        return 8;
      }
      case 0x3c: {
        // INC A
        this.#inc8("A");
        return 4;
      }
      case 0x3d: {
        // DEC A
        this.#dec8("A");
        return 4;
      }
      case 0x3e:
        // LD A, n8
        this.#registers.A = this.#memory.readByte(this.#registers.PC);
        this.#registers.PC++;
        return 8;
      case 0x3f:
        // CCF
        this.#registers.flagSubtract = false;
        this.#registers.flagHalfCarry = false;
        this.#registers.flagCarry = !this.#registers.flagCarry;
        return 4;
      case 0x40:
        // LD B, B
        return 4;
      case 0x41:
        // LD B, C
        this.#registers.B = this.#registers.C;
        return 4;
      case 0x42:
        // LD B, D
        this.#registers.B = this.#registers.D;
        return 4;
      case 0x43:
        // LD B, E
        this.#registers.B = this.#registers.E;
        return 4;
      case 0x44:
        // LD B, H
        this.#registers.B = this.#registers.H;
        return 4;
      case 0x45:
        // LD B, L
        this.#registers.B = this.#registers.L;
        return 4;
      case 0x46:
        // LD B, (HL)
        this.#registers.B = this.#memory.readByte(this.#registers.HL);
        return 8;
      case 0x47:
        // LD B, A
        this.#registers.B = this.#registers.A;
        return 4;
      case 0x48:
        // LD C, B
        this.#registers.C = this.#registers.B;
        return 4;
      case 0x49:
        // LD C, C
        return 4;
      case 0x4a:
        // LD C, D
        this.#registers.C = this.#registers.D;
        return 4;
      case 0x4b:
        // LD C, E
        this.#registers.C = this.#registers.E;
        return 4;
      case 0x4c:
        // LD C, H
        this.#registers.C = this.#registers.H;
        return 4;
      case 0x4d:
        // LD C, L
        this.#registers.C = this.#registers.L;
        return 4;
      case 0x4e:
        // LD C, (HL)
        this.#registers.C = this.#memory.readByte(this.#registers.HL);
        return 8;
      case 0x4f:
        // LD C, A
        this.#registers.C = this.#registers.A;
        return 4;
      case 0x50:
        // LD D, B
        this.#registers.D = this.#registers.B;
        return 4;
      case 0x51:
        // LD D, C
        this.#registers.D = this.#registers.C;
        return 4;
      case 0x52:
        // LD D, D
        return 4;
      case 0x53:
        // LD D, E
        this.#registers.D = this.#registers.E;
        return 4;
      case 0x54:
        // LD D, H
        this.#registers.D = this.#registers.H;
        return 4;
      case 0x55:
        // LD D, L
        this.#registers.D = this.#registers.L;
        return 4;
      case 0x56:
        // LD D, (HL)
        this.#registers.D = this.#memory.readByte(this.#registers.HL);
        return 8;
      case 0x57:
        // LD D, A
        this.#registers.D = this.#registers.A;
        return 4;
      case 0x58:
        // LD E, B
        this.#registers.E = this.#registers.B;
        return 4;
      case 0x59:
        // LD E, C
        this.#registers.E = this.#registers.C;
        return 4;
      case 0x5a:
        // LD E, D
        this.#registers.E = this.#registers.D;
        return 4;
      case 0x5b:
        // LD E, E
        return 4;
      case 0x5c:
        // LD E, H
        this.#registers.E = this.#registers.H;
        return 4;
      case 0x5d:
        // LD E, L
        this.#registers.E = this.#registers.L;
        return 4;
      case 0x5e:
        // LD E, (HL)
        this.#registers.E = this.#memory.readByte(this.#registers.HL);
        return 8;
      case 0x5f:
        // LD E, A
        this.#registers.E = this.#registers.A;
        return 4;
      case 0x60:
        // LD H, B
        this.#registers.H = this.#registers.B;
        return 4;
      case 0x61:
        // LD H, C
        this.#registers.H = this.#registers.C;
        return 4;
      case 0x62:
        // LD H, D
        this.#registers.H = this.#registers.D;
        return 4;
      case 0x63:
        // LD H, E
        this.#registers.H = this.#registers.E;
        return 4;
      case 0x64:
        // LD H, H
        return 4;
      case 0x65:
        // LD H, L
        this.#registers.H = this.#registers.L;
        return 4;
      case 0x66:
        // LD H, (HL)
        this.#registers.H = this.#memory.readByte(this.#registers.HL);
        return 8;
      case 0x67:
        // LD H, A
        this.#registers.H = this.#registers.A;
        return 4;
      case 0x68:
        // LD L, B
        this.#registers.L = this.#registers.B;
        return 4;
      case 0x69:
        // LD L, C
        this.#registers.L = this.#registers.C;
        return 4;
      case 0x6a:
        // LD L, D
        this.#registers.L = this.#registers.D;
        return 4;
      case 0x6b:
        // LD L, E
        this.#registers.L = this.#registers.E;
        return 4;
      case 0x6c:
        // LD L, H
        this.#registers.L = this.#registers.H;
        return 4;
      case 0x6d:
        // LD L, L
        return 4;
      case 0x6e:
        // LD L, (HL)
        this.#registers.L = this.#memory.readByte(this.#registers.HL);
        return 8;
      case 0x6f:
        // LD L, A
        this.#registers.L = this.#registers.A;
        return 4;
      case 0x70:
        // LD (HL), B
        this.#memory.writeByte(this.#registers.HL, this.#registers.B);
        return 8;
      case 0x71:
        // LD (HL), C
        this.#memory.writeByte(this.#registers.HL, this.#registers.C);
        return 8;
      case 0x72:
        // LD (HL), D
        this.#memory.writeByte(this.#registers.HL, this.#registers.D);
        return 8;
      case 0x73:
        // LD (HL), E
        this.#memory.writeByte(this.#registers.HL, this.#registers.E);
        return 8;
      case 0x74:
        // LD (HL), H
        this.#memory.writeByte(this.#registers.HL, this.#registers.H);
        return 8;
      case 0x75:
        // LD (HL), L
        this.#memory.writeByte(this.#registers.HL, this.#registers.L);
        return 8;
      case 0x76:
        // HALT
        const haltBug =
          this.#interrupts.hasPendingInterrupts() && !this.#interrupts.IME;

        if (haltBug) {
          this.#haltBugMode = true;
        } else {
          this.#halted = true;
        }

        return 0;
      case 0x77:
        // LD (HL), A
        this.#memory.writeByte(this.#registers.HL, this.#registers.A);
        return 8;
      case 0x78:
        // LD A, B
        this.#registers.A = this.#registers.B;
        return 4;
      case 0x79:
        // LD A, C
        this.#registers.A = this.#registers.C;
        return 4;
      case 0x7a:
        // LD A, D
        this.#registers.A = this.#registers.D;
        return 4;
      case 0x7b:
        // LD A, E
        this.#registers.A = this.#registers.E;
        return 4;
      case 0x7c:
        // LD A, H
        this.#registers.A = this.#registers.H;
        return 4;
      case 0x7d:
        // LD A, L
        this.#registers.A = this.#registers.L;
        return 4;
      case 0x7e:
        // LD A, (HL)
        this.#registers.A = this.#memory.readByte(this.#registers.HL);
        return 8;
      case 0x7f:
        // LD A, A
        return 4;
      case 0x80:
        // ADD A, B
        this.#add8("A", "B");
        return 4;
      case 0x81:
        // ADD A, C
        this.#add8("A", "C");
        return 4;
      case 0x82:
        // ADD A, D
        this.#add8("A", "D");
        return 4;
      case 0x83:
        // ADD A, E
        this.#add8("A", "E");
        return 4;
      case 0x84:
        // ADD A, H
        this.#add8("A", "H");
        return 4;
      case 0x85:
        // ADD A, L
        this.#add8("A", "L");
        return 4;
      case 0x86:
        // ADD A, (HL)
        this.#add8val("A", this.#memory.readByte(this.#registers.HL));
        return 8;
      case 0x87:
        // ADD A, A
        this.#add8("A", "A");
        return 4;
      case 0x88:
        // ADC A, B
        this.#adc("A", "B");
        return 4;
      case 0x89:
        // ADC A, C
        this.#adc("A", "C");
        return 4;
      case 0x8a:
        // ADC A, D
        this.#adc("A", "D");
        return 4;
      case 0x8b:
        // ADC A, E
        this.#adc("A", "E");
        return 4;
      case 0x8c:
        // ADC A, H
        this.#adc("A", "H");
        return 4;
      case 0x8d:
        // ADC A, L
        this.#adc("A", "L");
        return 4;
      case 0x8e:
        // ADC A, (HL)
        this.#adcVal("A", this.#memory.readByte(this.#registers.HL));
        return 8;
      case 0x8f:
        // ADC A, A
        this.#adc("A", "A");
        return 4;
      case 0x90:
        // SUB A, B
        this.#sub("B");
        return 4;
      case 0x91:
        // SUB A, C
        this.#sub("C");
        return 4;
      case 0x92:
        // SUB A, D
        this.#sub("D");
        return 4;
      case 0x93:
        // SUB A, E
        this.#sub("E");
        return 4;
      case 0x94:
        // SUB A, H
        this.#sub("H");
        return 4;
      case 0x95:
        // SUB A, L
        this.#sub("L");
        return 4;
      case 0x96:
        // SUB A, (HL)
        this.#subVal(this.#memory.readByte(this.#registers.HL));
        return 8;
      case 0x97:
        // SUB A, A
        this.#sub("A");
        return 4;
      case 0x98:
        // SBC A, B
        this.#sbc("B");
        return 4;
      case 0x99:
        // SBC A, C
        this.#sbc("C");
        return 4;
      case 0x9a:
        // SBC A, D
        this.#sbc("D");
        return 4;
      case 0x9b:
        // SBC A, E
        this.#sbc("E");
        return 4;
      case 0x9c:
        // SBC A, H
        this.#sbc("H");
        return 4;
      case 0x9d:
        // SBC A, L
        this.#sbc("L");
        return 4;
      case 0x9e:
        // SBC A, (HL)
        this.#sbcVal(this.#memory.readByte(this.#registers.HL));
        return 8;
      case 0x9f:
        // SBC A, A
        this.#sbc("A");
        return 4;
      case 0xa0:
        // AND A, B
        this.#and(this.#registers.B);
        return 4;
      case 0xa1:
        // AND A, C
        this.#and(this.#registers.C);
        return 4;
      case 0xa2:
        // AND A, D
        this.#and(this.#registers.D);
        return 4;
      case 0xa3:
        // AND A, E
        this.#and(this.#registers.E);
        return 4;
      case 0xa4:
        // AND A, H
        this.#and(this.#registers.H);
        return 4;
      case 0xa5:
        // AND A, L
        this.#and(this.#registers.L);
        return 4;
      case 0xa6:
        // AND A, (HL)
        this.#and(this.#memory.readByte(this.#registers.HL));
        return 8;
      case 0xa7:
        // AND A, A
        this.#and(this.#registers.A);
        return 4;
      case 0xa8:
        // XOR A, B
        this.#xor(this.#registers.B);
        return 4;
      case 0xa9:
        // XOR A, C
        this.#xor(this.#registers.C);
        return 4;
      case 0xaa:
        // XOR A, D
        this.#xor(this.#registers.D);
        return 4;
      case 0xab:
        // XOR A, E
        this.#xor(this.#registers.E);
        return 4;
      case 0xac:
        // XOR A, H
        this.#xor(this.#registers.H);
        return 4;
      case 0xad:
        // XOR A, L
        this.#xor(this.#registers.L);
        return 4;
      case 0xae:
        // XOR A, (HL)
        this.#xor(this.#memory.readByte(this.#registers.HL));
        return 8;
      case 0xaf:
        // XOR A, A
        this.#xor(this.#registers.A);
        return 4;
      case 0xb0:
        // OR A, B
        this.#or(this.#registers.B);
        return 4;
      case 0xb1:
        // OR A, C
        this.#or(this.#registers.C);
        return 4;
      case 0xb2:
        // OR A, D
        this.#or(this.#registers.D);
        return 4;
      case 0xb3:
        // OR A, E
        this.#or(this.#registers.E);
        return 4;
      case 0xb4:
        // OR A, H
        this.#or(this.#registers.H);
        return 4;
      case 0xb5:
        // OR A, L
        this.#or(this.#registers.L);
        return 4;
      case 0xb6:
        // OR A, (HL)
        this.#or(this.#memory.readByte(this.#registers.HL));
        return 8;
      case 0xb7:
        // OR A, A
        this.#or(this.#registers.A);
        return 4;
      case 0xb8:
        // CP A, B
        this.#cp(this.#registers.B);
        return 4;
      case 0xb9:
        // CP A, C
        this.#cp(this.#registers.C);
        return 4;
      case 0xba:
        // CP A, D
        this.#cp(this.#registers.D);
        return 4;
      case 0xbb:
        // CP A, E
        this.#cp(this.#registers.E);
        return 4;
      case 0xbc:
        // CP A, H
        this.#cp(this.#registers.H);
        return 4;
      case 0xbd:
        // CP A, L
        this.#cp(this.#registers.L);
        return 4;
      case 0xbe:
        // CP A, (HL)
        this.#cp(this.#memory.readByte(this.#registers.HL));
        return 8;
      case 0xbf:
        // CP A, A
        this.#cp(this.#registers.A);
        return 4;
      case 0xc0:
        // RET NZ
        if (!this.#registers.flagZero) {
          this.#registers.PC = this.#pop();
          return 20;
        }
        return 8;
      case 0xc1:
        // POP BC
        this.#registers.BC = this.#memory.readWord(this.#registers.SP);
        this.#registers.SP += 2;
        return 12;
      case 0xc2:
        // JP NZ, a16
        if (!this.#registers.flagZero) {
          this.#registers.PC = this.#memory.readWord(this.#registers.PC);
          return 16;
        }
        this.#registers.PC += 2;
        return 12;
      case 0xc3:
        // JP a16
        this.#registers.PC = this.#memory.readWord(this.#registers.PC);
        return 16;
      case 0xc4:
        // CALL NZ, a16
        if (!this.#registers.flagZero) {
          this.#call(this.#memory.readWord(this.#registers.PC));
          return 24;
        }
        this.#registers.PC += 2;
        return 12;
      case 0xc5:
        // PUSH BC
        this.#push(this.#registers.BC);
        return 16;
      case 0xc6:
        // ADD A, n8
        this.#add8val("A", this.#memory.readByte(this.#registers.PC));
        this.#registers.PC++;
        return 8;
      case 0xc7:
        // RST 00H
        this.#rst(0x0000);
        return 16;
      case 0xc8:
        // RET Z
        if (this.#registers.flagZero) {
          this.#registers.PC = this.#pop();
          return 20;
        }
        return 8;
      case 0xc9:
        // RET
        this.#registers.PC = this.#pop();
        return 16;
      case 0xca:
        // JP Z, a16
        if (this.#registers.flagZero) {
          this.#registers.PC = this.#memory.readWord(this.#registers.PC);
          return 16;
        }
        this.#registers.PC += 2;
        return 12;
      case 0xcb:
        // PREFIX CB
        opcode = this.#memory.readByte(this.#registers.PC);
        return this.#executePrefixed(opcode);
      case 0xcc:
        // CALL Z, a16
        if (this.#registers.flagZero) {
          this.#call(this.#memory.readWord(this.#registers.PC));
          return 24;
        }
        this.#registers.PC += 2;
        return 12;
      case 0xcd:
        // CALL a16
        this.#call(this.#memory.readWord(this.#registers.PC));
        return 24;
      case 0xce:
        // ADC A, n8
        this.#adcVal("A", this.#memory.readByte(this.#registers.PC));
        this.#registers.PC++;
        return 8;
      case 0xcf:
        // RST 08H
        this.#rst(0x08);
        return 16;
      case 0xd0:
        // RET NC
        if (!this.#registers.flagCarry) {
          this.#registers.PC = this.#pop();
          return 20;
        }
        return 8;
      case 0xd1:
        // POP DE
        this.#registers.DE = this.#pop();
        return 12;
      case 0xd2:
        // JP NC, a16
        if (!this.#registers.flagCarry) {
          this.#registers.PC = this.#memory.readWord(this.#registers.PC);
          return 16;
        }
        this.#registers.PC += 2;
        return 12;
      case 0xd3:
        throw new Error("Illegal instruction 0xD3");
      case 0xd4:
        // CALL NC, a16
        if (!this.#registers.flagCarry) {
          this.#call(this.#memory.readWord(this.#registers.PC));
          return 24;
        }
        this.#registers.PC += 2;
        return 12;
      case 0xd5:
        // PUSH DE
        this.#push(this.#registers.DE);
        return 16;
      case 0xd6:
        // SUB A, n8
        this.#subVal(this.#memory.readByte(this.#registers.PC));
        this.#registers.PC++;
        return 8;
      case 0xd7:
        // RST 10H
        this.#rst(0x0010);
        return 16;
      case 0xd8:
        // RET C
        if (this.#registers.flagCarry) {
          this.#registers.PC = this.#pop();
          return 20;
        }
        return 8;
      case 0xd9:
        // RETI
        this.#registers.PC = this.#pop();
        this.#interrupts.enableInterrupts(true);
        return 16;
      case 0xda:
        // JP C, a16
        if (this.#registers.flagCarry) {
          this.#registers.PC = this.#memory.readWord(this.#registers.PC);
          return 16;
        }
        this.#registers.PC += 2;
        return 12;
      case 0xdb:
        throw new Error("Illegal instruction 0xDB");
      case 0xdc:
        // CALL C, a16
        if (this.#registers.flagCarry) {
          this.#call(this.#memory.readWord(this.#registers.PC));
          return 24;
        }
        this.#registers.PC += 2;
        return 12;
      case 0xdd:
        throw new Error("Illegal instruction 0xDD");
      case 0xde:
        // SBC A, n8
        this.#sbcVal(this.#memory.readByte(this.#registers.PC));
        this.#registers.PC++;
        return 8;
      case 0xdf:
        // RST 18H
        this.#rst(0x0018);
        return 16;
      case 0xe0: {
        // LDH (a8), A
        const value = this.#memory.readByte(this.#registers.PC);
        this.#memory.writeByte(0xff00 + value, this.#registers.A & 0xff);
        this.#registers.PC++;
        return 12;
      }
      case 0xe1:
        // POP HL
        this.#registers.HL = this.#pop();
        return 12;
      case 0xe2:
        // LD (C), A
        this.#memory.writeByte(0xff00 + this.#registers.C, this.#registers.A);
        return 8;
      case 0xe3:
        throw new Error("Illegal instruction 0xE3");
      case 0xe4:
        throw new Error("Illegal instruction 0xE4");
      case 0xe5:
        // PUSH HL
        this.#push(this.#registers.HL);
        return 16;
      case 0xe6:
        // AND A, n8
        this.#and(this.#memory.readByte(this.#registers.PC));
        this.#registers.PC++;
        return 8;
      case 0xe7:
        // RST 20H
        this.#rst(0x0020);
        return 16;
      case 0xe8: {
        // ADD SP, e8
        const value = this.#memory.readByte(this.#registers.PC, true);
        const result = this.#registers.SP + value;
        this.#registers.flagZero = false;
        this.#registers.flagSubtract = false;
        this.#registers.flagCarry =
          (value & 0xff) + (this.#registers.SP & 0xff) > 0xff;
        this.#registers.flagHalfCarry = isHalfCarry8(this.#registers.SP, value);
        this.#registers.SP = result & 0xffff;
        this.#registers.PC++;
        return 16;
      }
      case 0xe9:
        // JP HL
        this.#registers.PC = this.#registers.HL;
        return 4;
      case 0xea:
        // LD (a16), A
        this.#memory.writeByte(
          this.#memory.readWord(this.#registers.PC),
          this.#registers.A,
        );
        this.#registers.PC += 2;
        return 16;
      case 0xeb:
        throw new Error("Illegal instruction 0xEB");
      case 0xec:
        throw new Error("Illegal instruction 0xEC");
      case 0xed:
        throw new Error("Illegal instruction 0xED");
      case 0xee:
        // XOR A, n8
        this.#xor(this.#memory.readByte(this.#registers.PC));
        this.#registers.PC++;
        return 8;
      case 0xef:
        // RST 28H
        this.#rst(0x0028);
        return 16;
      case 0xf0:
        // LDH A, (n8)
        this.#registers.A =
          this.#memory.readByte(
            0xff00 + this.#memory.readByte(this.#registers.PC),
          ) & 0xff;
        this.#registers.PC++;
        return 12;
      case 0xf1:
        // POP AF
        this.#registers.A = this.#memory.readByte(this.#registers.SP + 1);
        const f = this.#memory.readByte(this.#registers.SP);
        this.#registers.flagZero = ((f >> 7) & 0b1) === 1;
        this.#registers.flagSubtract = ((f >> 6) & 0b1) === 1;
        this.#registers.flagHalfCarry = ((f >> 5) & 0b1) === 1;
        this.#registers.flagCarry = ((f >> 4) & 0b1) === 1;
        this.#registers.SP += 2;
        return 12;
      case 0xf2:
        // LD A, (C)
        this.#registers.A = this.#memory.readByte(0xff00 + this.#registers.C);
        return 8;
      case 0xf3:
        // DI
        this.#interrupts.enableInterrupts(false);
        return 4;
      case 0xf4:
        throw new Error("Illegal instruction 0xF4");
      case 0xf5:
        // PUSH AF
        this.#push(this.#registers.AF);
        return 16;
      case 0xf6:
        // OR A, n8
        this.#or(this.#memory.readByte(this.#registers.PC));
        this.#registers.PC++;
        return 8;
      case 0xf7:
        // RST 30H
        this.#rst(0x0030);
        return 16;
      case 0xf8: {
        // LD HL, SP + e8
        const value = this.#memory.readByte(this.#registers.PC, true);
        const result = this.#registers.SP + value;
        this.#registers.flagZero = false;
        this.#registers.flagSubtract = false;
        this.#registers.flagCarry =
          (value & 0xff) + (this.#registers.SP & 0xff) > 0xff;
        this.#registers.flagHalfCarry = isHalfCarry8(this.#registers.SP, value);
        this.#registers.HL = result & 0xffff;
        this.#registers.PC++;
        return 12;
      }
      case 0xf9:
        // LD SP, HL
        this.#registers.SP = this.#registers.HL;
        return 8;
      case 0xfa:
        // LD A, (a16)
        this.#registers.A = this.#memory.readByte(
          this.#memory.readWord(this.#registers.PC),
        );
        this.#registers.PC += 2;
        return 16;
      case 0xfb:
        // EI
        this.#interrupts.enableInterrupts(true, 1);
        return 4;
      case 0xfc:
        throw new Error("Illegal instruction 0xFC");
      case 0xfd:
        throw new Error("Illegal instruction 0xFD");
      case 0xfe:
        // CP A, n8
        this.#cp(this.#memory.readByte(this.#registers.PC));
        this.#registers.PC++;
        return 8;
      case 0xff:
        // RST 38H
        this.#rst(0x0038);
        return 16;
      default:
        throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
    }
  }

  /**
   * @returns {number} The number of tCycles the instruction took
   */
  #executePrefixed(opcode) {
    this.#incrementPC();
    switch (opcode) {
      case 0x00:
        // RLC B
        this.#rlc("B");
        return 8;
      case 0x01:
        // RLC C
        this.#rlc("C");
        return 8;
      case 0x02:
        // RLC D
        this.#rlc("D");
        return 8;
      case 0x03:
        // RLC E
        this.#rlc("E");
        return 8;
      case 0x04:
        // RLC H
        this.#rlc("H");
        return 8;
      case 0x05:
        // RLC L
        this.#rlc("L");
        return 8;
      case 0x06:
        // RLC (HL)
        this.#rlcRef(this.#registers.HL);
        return 16;
      case 0x07:
        // RLC A
        this.#rlc("A");
        return 8;
      case 0x08:
        // RRC B
        this.#rrc("B");
        return 8;
      case 0x09:
        // RRC C
        this.#rrc("C");
        return 8;
      case 0x0a:
        // RRC D
        this.#rrc("D");
        return 8;
      case 0x0b:
        // RRC E
        this.#rrc("E");
        return 8;
      case 0x0c:
        // RRC H
        this.#rrc("H");
        return 8;
      case 0x0d:
        // RRC L
        this.#rrc("L");
        return 8;
      case 0x0e:
        // RRC (HL)
        this.#rrcRef(this.#registers.HL);
        return 16;
      case 0x0f:
        // RRC A
        this.#rrc("A");
        return 8;
      case 0x10:
        // RL B
        this.#rl("B");
        return 8;
      case 0x11:
        // RL C
        this.#rl("C");
        return 8;
      case 0x12:
        // RL D
        this.#rl("D");
        return 8;
      case 0x13:
        // RL E
        this.#rl("E");
        return 8;
      case 0x14:
        // RL H
        this.#rl("H");
        return 8;
      case 0x15:
        // RL L
        this.#rl("L");
        return 8;
      case 0x16:
        // RL (HL)
        this.#rlRef(this.#registers.HL);
        return 16;
      case 0x17:
        // RL A
        this.#rl("A");
        return 8;
      case 0x18:
        // RR B
        this.#rr("B");
        return 8;
      case 0x19:
        // RR C
        this.#rr("C");
        return 8;
      case 0x1a:
        // RR D
        this.#rr("D");
        return 8;
      case 0x1b:
        // RR E
        this.#rr("E");
        return 8;
      case 0x1c:
        // RR H
        this.#rr("H");
        return 8;
      case 0x1d:
        // RR L
        this.#rr("L");
        return 8;
      case 0x1e:
        // RR (HL)
        this.#rrRef(this.#registers.HL);
        return 16;
      case 0x1f:
        // RR A
        this.#rr("A");
        return 8;
      case 0x20:
        // SLA B
        this.#sla("B");
        return 8;
      case 0x21:
        // SLA C
        this.#sla("C");
        return 8;
      case 0x22:
        // SLA D
        this.#sla("D");
        return 8;
      case 0x23:
        // SLA E
        this.#sla("E");
        return 8;
      case 0x24:
        // SLA H
        this.#sla("H");
        return 8;
      case 0x25:
        // SLA L
        this.#sla("L");
        return 8;
      case 0x26:
        // SLA (HL)
        this.#slaRef(this.#registers.HL);
        return 16;
      case 0x27:
        // SLA A
        this.#sla("A");
        return 8;
      case 0x28:
        // SRA B
        this.#sra("B");
        return 8;
      case 0x29:
        // SRA C
        this.#sra("C");
        return 8;
      case 0x2a:
        // SRA D
        this.#sra("D");
        return 8;
      case 0x2b:
        // SRA E
        this.#sra("E");
        return 8;
      case 0x2c:
        // SRA H
        this.#sra("H");
        return 8;
      case 0x2d:
        // SRA L
        this.#sra("L");
        return 8;
      case 0x2e:
        // SRA (HL)
        this.#sraRef(this.#registers.HL);
        return 16;
      case 0x2f:
        // SRA A
        this.#sra("A");
        return 8;
      case 0x30:
        // SWAP B
        this.#swap("B");
        return 8;
      case 0x31:
        // SWAP C
        this.#swap("C");
        return 8;
      case 0x32:
        // SWAP D
        this.#swap("D");
        return 8;
      case 0x33:
        // SWAP E
        this.#swap("E");
        return 8;
      case 0x34:
        // SWAP H
        this.#swap("H");
        return 8;
      case 0x35:
        // SWAP L
        this.#swap("L");
        return 8;
      case 0x36:
        // SWAP (HL)
        this.#swapRef(this.#registers.HL);
        return 16;
      case 0x37:
        // SWAP A
        this.#swap("A");
        return 8;
      case 0x38:
        // SRL B
        this.#srl("B");
        return 8;
      case 0x39:
        // SRL C
        this.#srl("C");
        return 8;
      case 0x3a:
        // SRL D
        this.#srl("D");
        return 8;
      case 0x3b:
        // SRL E
        this.#srl("E");
        return 8;
      case 0x3c:
        // SRL H
        this.#srl("H");
        return 8;
      case 0x3d:
        // SRL L
        this.#srl("L");
        return 8;
      case 0x3e:
        // SRL (HL)
        this.#srlRef(this.#registers.HL);
        return 16;
      case 0x3f:
        // SRL A
        this.#srl("A");
        return 8;
      case 0x40:
        // BIT 0, B
        this.#bit(0, this.#registers.B);
        return 8;
      case 0x41:
        // BIT 0, C
        this.#bit(0, this.#registers.C);
        return 8;
      case 0x42:
        // BIT 0, D
        this.#bit(0, this.#registers.D);
        return 8;
      case 0x43:
        // BIT 0, E
        this.#bit(0, this.#registers.E);
        return 8;
      case 0x44:
        // BIT 0, H
        this.#bit(0, this.#registers.H);
        return 8;
      case 0x45:
        // BIT 0, L
        this.#bit(0, this.#registers.L);
        return 8;
      case 0x46:
        // BIT 0, (HL)
        this.#bit(0, this.#memory.readByte(this.#registers.HL));
        return 12;
      case 0x47:
        // BIT 0, A
        this.#bit(0, this.#registers.A);
        return 8;
      case 0x48:
        // BIT 1, B
        this.#bit(1, this.#registers.B);
        return 8;
      case 0x49:
        // BIT 1, C
        this.#bit(1, this.#registers.C);
        return 8;
      case 0x4a:
        // BIT 1, D
        this.#bit(1, this.#registers.D);
        return 8;
      case 0x4b:
        // BIT 1, E
        this.#bit(1, this.#registers.E);
        return 8;
      case 0x4c:
        // BIT 1, H
        this.#bit(1, this.#registers.H);
        return 8;
      case 0x4d:
        // BIT 1, L
        this.#bit(1, this.#registers.L);
        return 8;
      case 0x4e:
        // BIT 1, (HL)
        this.#bit(1, this.#memory.readByte(this.#registers.HL));
        return 12;
      case 0x4f:
        // BIT 1, A
        this.#bit(1, this.#registers.A);
        return 8;
      case 0x50:
        // BIT 2, B
        this.#bit(2, this.#registers.B);
        return 8;
      case 0x51:
        // BIT 2, C
        this.#bit(2, this.#registers.C);
        return 8;
      case 0x52:
        // BIT 2, D
        this.#bit(2, this.#registers.D);
        return 8;
      case 0x53:
        // BIT 2, E
        this.#bit(2, this.#registers.E);
        return 8;
      case 0x54:
        // BIT 2, H
        this.#bit(2, this.#registers.H);
        return 8;
      case 0x55:
        // BIT 2, L
        this.#bit(2, this.#registers.L);
        return 8;
      case 0x56:
        // BIT 2, (HL)
        this.#bit(2, this.#memory.readByte(this.#registers.HL));
        return 12;
      case 0x57:
        // BIT 2, A
        this.#bit(2, this.#registers.A);
        return 8;
      case 0x58:
        // BIT 3, B
        this.#bit(3, this.#registers.B);
        return 8;
      case 0x59:
        // BIT 3, C
        this.#bit(3, this.#registers.C);
        return 8;
      case 0x5a:
        // BIT 3, D
        this.#bit(3, this.#registers.D);
        return 8;
      case 0x5b:
        // BIT 3, E
        this.#bit(3, this.#registers.E);
        return 8;
      case 0x5c:
        // BIT 3, H
        this.#bit(3, this.#registers.H);
        return 8;
      case 0x5d:
        // BIT 3, L
        this.#bit(3, this.#registers.L);
        return 8;
      case 0x5e:
        // BIT 3, (HL)
        this.#bit(3, this.#memory.readByte(this.#registers.HL));
        return 12;
      case 0x5f:
        // BIT 3, A
        this.#bit(3, this.#registers.A);
        return 8;
      case 0x60:
        // BIT 4, B
        this.#bit(4, this.#registers.B);
        return 8;
      case 0x61:
        // BIT 4, C
        this.#bit(4, this.#registers.C);
        return 8;
      case 0x62:
        // BIT 4, D
        this.#bit(4, this.#registers.D);
        return 8;
      case 0x63:
        // BIT 4, E
        this.#bit(4, this.#registers.E);
        return 8;
      case 0x64:
        // BIT 4, H
        this.#bit(4, this.#registers.H);
        return 8;
      case 0x65:
        // BIT 4, L
        this.#bit(4, this.#registers.L);
        return 8;
      case 0x66:
        // BIT 4, (HL)
        this.#bit(4, this.#memory.readByte(this.#registers.HL));
        return 12;
      case 0x67:
        // BIT 4, A
        this.#bit(4, this.#registers.A);
        return 8;
      case 0x68:
        // BIT 5, B
        this.#bit(5, this.#registers.B);
        return 8;
      case 0x69:
        // BIT 5, C
        this.#bit(5, this.#registers.C);
        return 8;
      case 0x6a:
        // BIT 5, D
        this.#bit(5, this.#registers.D);
        return 8;
      case 0x6b:
        // BIT 5, E
        this.#bit(5, this.#registers.E);
        return 8;
      case 0x6c:
        // BIT 5, H
        this.#bit(5, this.#registers.H);
        return 8;
      case 0x6d:
        // BIT 5, L
        this.#bit(5, this.#registers.L);
        return 8;
      case 0x6e:
        // BIT 5, (HL)
        this.#bit(5, this.#memory.readByte(this.#registers.HL));
        return 12;
      case 0x6f:
        // BIT 5, A
        this.#bit(5, this.#registers.A);
        return 8;
      case 0x70:
        // BIT 6, B
        this.#bit(6, this.#registers.B);
        return 8;
      case 0x71:
        // BIT 6, C
        this.#bit(6, this.#registers.C);
        return 8;
      case 0x72:
        // BIT 6, D
        this.#bit(6, this.#registers.D);
        return 8;
      case 0x73:
        // BIT 6, E
        this.#bit(6, this.#registers.E);
        return 8;
      case 0x74:
        // BIT 6, H
        this.#bit(6, this.#registers.H);
        return 8;
      case 0x75:
        // BIT 6, L
        this.#bit(6, this.#registers.L);
        return 8;
      case 0x76:
        // BIT 6, (HL)
        this.#bit(6, this.#memory.readByte(this.#registers.HL));
        return 12;
      case 0x77:
        // BIT 6, A
        this.#bit(6, this.#registers.A);
        return 8;
      case 0x78:
        // BIT 7, B
        this.#bit(7, this.#registers.B);
        return 8;
      case 0x79:
        // BIT 7, C
        this.#bit(7, this.#registers.C);
        return 8;
      case 0x7a:
        // BIT 7, D
        this.#bit(7, this.#registers.D);
        return 8;
      case 0x7b:
        // BIT 7, E
        this.#bit(7, this.#registers.E);
        return 8;
      case 0x7c:
        // BIT 7, H
        this.#bit(7, this.#registers.H);
        return 8;
      case 0x7d:
        // BIT 7, L
        this.#bit(7, this.#registers.L);
        return 8;
      case 0x7e:
        // BIT 7, (HL)
        this.#bit(7, this.#memory.readByte(this.#registers.HL));
        return 12;
      case 0x7f:
        // BIT 7, A
        this.#bit(7, this.#registers.A);
        return 8;
      case 0x80:
        // RES 0, B
        this.#res(0, "B");
        return 8;
      case 0x81:
        // RES 0, C
        this.#res(0, "C");
        return 8;
      case 0x82:
        // RES 0, D
        this.#res(0, "D");
        return 8;
      case 0x83:
        // RES 0, E
        this.#res(0, "E");
        return 8;
      case 0x84:
        // RES 0, H
        this.#res(0, "H");
        return 8;
      case 0x85:
        // RES 0, L
        this.#res(0, "L");
        return 8;
      case 0x86:
        // RES 0, (HL)
        this.#resRef(0, this.#registers.HL);
        return 16;
      case 0x87:
        // RES 0, A
        this.#res(0, "A");
        return 8;
      case 0x88:
        // RES 1, B
        this.#res(1, "B");
        return 8;
      case 0x89:
        // RES 1, C
        this.#res(1, "C");
        return 8;
      case 0x8a:
        // RES 1, D
        this.#res(1, "D");
        return 8;
      case 0x8b:
        // RES 1, E
        this.#res(1, "E");
        return 8;
      case 0x8c:
        // RES 1, H
        this.#res(1, "H");
        return 8;
      case 0x8d:
        // RES 1, L
        this.#res(1, "L");
        return 8;
      case 0x8e:
        // RES 1, (HL)
        this.#resRef(1, this.#registers.HL);
        return 16;
      case 0x8f:
        // RES 1, A
        this.#res(1, "A");
        return 8;
      case 0x90:
        // RES 2, B
        this.#res(2, "B");
        return 8;
      case 0x91:
        // RES 2, C
        this.#res(2, "C");
        return 8;
      case 0x92:
        // RES 2, D
        this.#res(2, "D");
        return 8;
      case 0x93:
        // RES 2, E
        this.#res(2, "E");
        return 8;
      case 0x94:
        // RES 2, H
        this.#res(2, "H");
        return 8;
      case 0x95:
        // RES 2, L
        this.#res(2, "L");
        return 8;
      case 0x96:
        // RES 2, (HL)
        this.#resRef(2, this.#registers.HL);
        return 16;
      case 0x97:
        // RES 2, A
        this.#res(2, "A");
        return 8;
      case 0x98:
        // RES 3, B
        this.#res(3, "B");
        return 8;
      case 0x99:
        // RES 3, C
        this.#res(3, "C");
        return 8;
      case 0x9a:
        // RES 3, D
        this.#res(3, "D");
        return 8;
      case 0x9b:
        // RES 3, E
        this.#res(3, "E");
        return 8;
      case 0x9c:
        // RES 3, H
        this.#res(3, "H");
        return 8;
      case 0x9d:
        // RES 3, L
        this.#res(3, "L");
        return 8;
      case 0x9e:
        // RES 3, (HL)
        this.#resRef(3, this.#registers.HL);
        return 16;
      case 0x9f:
        // RES 3, A
        this.#res(3, "A");
        return 8;
      case 0xa0:
        // RES 4, B
        this.#res(4, "B");
        return 8;
      case 0xa1:
        // RES 4, C
        this.#res(4, "C");
        return 8;
      case 0xa2:
        // RES 4, D
        this.#res(4, "D");
        return 8;
      case 0xa3:
        // RES 4, E
        this.#res(4, "E");
        return 8;
      case 0xa4:
        // RES 4, H
        this.#res(4, "H");
        return 8;
      case 0xa5:
        // RES 4, L
        this.#res(4, "L");
        return 8;
      case 0xa6:
        // RES 4, (HL)
        this.#resRef(4, this.#registers.HL);
        return 16;
      case 0xa7:
        // RES 4, A
        this.#res(4, "A");
        return 8;
      case 0xa8:
        // RES 5, B
        this.#res(5, "B");
        return 8;
      case 0xa9:
        // RES 5, C
        this.#res(5, "C");
        return 8;
      case 0xaa:
        // RES 5, D
        this.#res(5, "D");
        return 8;
      case 0xab:
        // RES 5, E
        this.#res(5, "E");
        return 8;
      case 0xac:
        // RES 5, H
        this.#res(5, "H");
        return 8;
      case 0xad:
        // RES 5, L
        this.#res(5, "L");
        return 8;
      case 0xae:
        // RES 5, (HL)
        this.#resRef(5, this.#registers.HL);
        return 16;
      case 0xaf:
        // RES 5, A
        this.#res(5, "A");
        return 8;
      case 0xb0:
        // RES 6, B
        this.#res(6, "B");
        return 8;
      case 0xb1:
        // RES 6, C
        this.#res(6, "C");
        return 8;
      case 0xb2:
        // RES 6, D
        this.#res(6, "D");
        return 8;
      case 0xb3:
        // RES 6, E
        this.#res(6, "E");
        return 8;
      case 0xb4:
        // RES 6, H
        this.#res(6, "H");
        return 8;
      case 0xb5:
        // RES 6, L
        this.#res(6, "L");
        return 8;
      case 0xb6:
        // RES 6, (HL)
        this.#resRef(6, this.#registers.HL);
        return 16;
      case 0xb7:
        // RES 6, A
        this.#res(6, "A");
        return 8;
      case 0xb8:
        // RES 7, B
        this.#res(7, "B");
        return 8;
      case 0xb9:
        // RES 7, C
        this.#res(7, "C");
        return 8;
      case 0xba:
        // RES 7, D
        this.#res(7, "D");
        return 8;
      case 0xbb:
        // RES 7, E
        this.#res(7, "E");
        return 8;
      case 0xbc:
        // RES 7, H
        this.#res(7, "H");
        return 8;
      case 0xbd:
        // RES 7, L
        this.#res(7, "L");
        return 8;
      case 0xbe:
        // RES 7, (HL)
        this.#resRef(7, this.#registers.HL);
        return 16;
      case 0xbf:
        // RES 7, A
        this.#res(7, "A");
        return 8;
      case 0xc0:
        // SET 0, B
        this.#set(0, "B");
        return 8;
      case 0xc1:
        // SET 0, C
        this.#set(0, "C");
        return 8;
      case 0xc2:
        // SET 0, D
        this.#set(0, "D");
        return 8;
      case 0xc3:
        // SET 0, E
        this.#set(0, "E");
        return 8;
      case 0xc4:
        // SET 0, H
        this.#set(0, "H");
        return 8;
      case 0xc5:
        // SET 0, L
        this.#set(0, "L");
        return 8;
      case 0xc6:
        // SET 0, (HL)
        this.#setRef(0, this.#registers.HL);
        return 16;
      case 0xc7:
        // SET 0, A
        this.#set(0, "A");
        return 8;
      case 0xc8:
        // SET 1, B
        this.#set(1, "B");
        return 8;
      case 0xc9:
        // SET 1, C
        this.#set(1, "C");
        return 8;
      case 0xca:
        // SET 1, D
        this.#set(1, "D");
        return 8;
      case 0xcb:
        // SET 1, E
        this.#set(1, "E");
        return 8;
      case 0xcc:
        // SET 1, H
        this.#set(1, "H");
        return 8;
      case 0xcd:
        // SET 1, L
        this.#set(1, "L");
        return 8;
      case 0xce:
        // SET 1, (HL)
        this.#setRef(1, this.#registers.HL);
        return 16;
      case 0xcf:
        // SET 1, A
        this.#set(1, "A");
        return 8;
      case 0xd0:
        // SET 2, B
        this.#set(2, "B");
        return 8;
      case 0xd1:
        // SET 2, C
        this.#set(2, "C");
        return 8;
      case 0xd2:
        // SET 2, D
        this.#set(2, "D");
        return 8;
      case 0xd3:
        // SET 2, E
        this.#set(2, "E");
        return 8;
      case 0xd4:
        // SET 2, H
        this.#set(2, "H");
        return 8;
      case 0xd5:
        // SET 2, L
        this.#set(2, "L");
        return 8;
      case 0xd6:
        // SET 2, (HL)
        this.#setRef(2, this.#registers.HL);
        return 16;
      case 0xd7:
        // SET 2, A
        this.#set(2, "A");
        return 8;
      case 0xd8:
        // SET 3, B
        this.#set(3, "B");
        return 8;
      case 0xd9:
        // SET 3, C
        this.#set(3, "C");
        return 8;
      case 0xda:
        // SET 3, D
        this.#set(3, "D");
        return 8;
      case 0xdb:
        // SET 3, E
        this.#set(3, "E");
        return 8;
      case 0xdc:
        // SET 3, H
        this.#set(3, "H");
        return 8;
      case 0xdd:
        // SET 3, L
        this.#set(3, "L");
        return 8;
      case 0xde:
        // SET 3, (HL)
        this.#setRef(3, this.#registers.HL);
        return 16;
      case 0xdf:
        // SET 3, A
        this.#set(3, "A");
        return 8;
      case 0xe0:
        // SET 4, B
        this.#set(4, "B");
        return 8;
      case 0xe1:
        // SET 4, C
        this.#set(4, "C");
        return 8;
      case 0xe2:
        // SET 4, D
        this.#set(4, "D");
        return 8;
      case 0xe3:
        // SET 4, E
        this.#set(4, "E");
        return 8;
      case 0xe4:
        // SET 4, H
        this.#set(4, "H");
        return 8;
      case 0xe5:
        // SET 4, L
        this.#set(4, "L");
        return 8;
      case 0xe6:
        // SET 4, (HL)
        this.#setRef(4, this.#registers.HL);
        return 16;
      case 0xe7:
        // SET 4, A
        this.#set(4, "A");
        return 8;
      case 0xe8:
        // SET 5, B
        this.#set(5, "B");
        return 8;
      case 0xe9:
        // SET 5, C
        this.#set(5, "C");
        return 8;
      case 0xea:
        // SET 5, D
        this.#set(5, "D");
        return 8;
      case 0xeb:
        // SET 5, E
        this.#set(5, "E");
        return 8;
      case 0xec:
        // SET 5, H
        this.#set(5, "H");
        return 8;
      case 0xed:
        // SET 5, L
        this.#set(5, "L");
        return 8;
      case 0xee:
        // SET 5, (HL)
        this.#setRef(5, this.#registers.HL);
        return 16;
      case 0xef:
        // SET 5, A
        this.#set(5, "A");
        return 8;
      case 0xf0:
        // SET 6, B
        this.#set(6, "B");
        return 8;
      case 0xf1:
        // SET 6, C
        this.#set(6, "C");
        return 8;
      case 0xf2:
        // SET 6, D
        this.#set(6, "D");
        return 8;
      case 0xf3:
        // SET 6, E
        this.#set(6, "E");
        return 8;
      case 0xf4:
        // SET 6, H
        this.#set(6, "H");
        return 8;
      case 0xf5:
        // SET 6, L
        this.#set(6, "L");
        return 8;
      case 0xf6:
        // SET 6, (HL)
        this.#setRef(6, this.#registers.HL);
        return 16;
      case 0xf7:
        // SET 6, A
        this.#set(6, "A");
        return 8;
      case 0xf8:
        // SET 7, B
        this.#set(7, "B");
        return 8;
      case 0xf9:
        // SET 7, C
        this.#set(7, "C");
        return 8;
      case 0xfa:
        // SET 7, D
        this.#set(7, "D");
        return 8;
      case 0xfb:
        // SET 7, E
        this.#set(7, "E");
        return 8;
      case 0xfc:
        // SET 7, H
        this.#set(7, "H");
        return 8;
      case 0xfd:
        // SET 7, L
        this.#set(7, "L");
        return 8;
      case 0xfe:
        // SET 7, (HL)
        this.#setRef(7, this.#registers.HL);
        return 16;
      case 0xff:
        // SET 7, A
        this.#set(7, "A");
        return 8;
      default:
        throw new Error(`Unknown opcode: 0xCB${opcode.toString(16)}`);
    }
  }

  /**
   * Increment the program counter handling the halt bug.
   */
  #incrementPC() {
    if (!this.#haltBugMode) {
      this.#registers.PC++;
    } else {
      this.#haltBugMode = false;
    }
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #inc8(r8) {
    const initial = this.#registers[r8];
    this.#registers[r8]++;
    this.#registers.flagZero = this.#registers[r8] == 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = isHalfCarry8(initial, 1);
  }

  /**
   * @param {number} ref
   */
  #inc8ref(ref) {
    const initial = this.#memory.readByte(ref);
    this.#memory.writeByte(ref, initial + 1);
    this.#registers.flagZero = this.#memory.readByte(ref) === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = isHalfCarry8(initial, 1);
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #dec8(r8) {
    const initial = this.#registers[r8];
    this.#registers[r8]--;
    this.#registers.flagZero = this.#registers[r8] === 0;
    this.#registers.flagSubtract = true;
    this.#registers.flagHalfCarry = isHalfBorrow8(initial, 1);
  }

  /**
   * @param {number} ref
   */
  #dec8ref(ref) {
    const initial = this.#memory.readByte(ref);
    this.#memory.writeByte(ref, initial - 1);
    this.#registers.flagZero = this.#memory.readByte(ref) === 0;
    this.#registers.flagSubtract = true;
    this.#registers.flagHalfCarry = isHalfBorrow8(initial, 1);
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} s8
   */
  #add8(r8, s8) {
    const result = this.#registers[r8] + this.#registers[s8];
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = isHalfCarry8(
      this.#registers[r8],
      this.#registers[s8],
    );
    this.#registers.flagCarry = result > 0xff;
    this.#registers[r8] = result & 0xff;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   * @param {number} value
   */
  #add8val(r8, value) {
    const result = this.#registers[r8] + value;
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = isHalfCarry8(this.#registers[r8], value);
    this.#registers.flagCarry = result > 0xff;
    this.#registers[r8] = result & 0xff;
  }

  /**
   * @param  {'HL' | 'BC' | 'DE' | 'HL' | 'SP'} r16
   * @param  {'HL' | 'BC' | 'DE' | 'HL' | 'SP'} s16
   */
  #add16(r16, s16) {
    const result = this.#registers[r16] + this.#registers[s16];
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = isHalfCarry16(
      this.#registers[r16],
      this.#registers[s16],
    );
    this.#registers.flagCarry = result > 0xffff;
    this.#registers[r16] = result & 0xffff;
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} s8
   */
  #adc(r8, s8) {
    const result =
      this.#registers[r8] + this.#registers[s8] + +this.#registers.flagCarry;
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = readBit(
      (this.#registers[r8] & 0xf) +
        (this.#registers[s8] & 0xf) +
        +this.#registers.flagCarry,
      4,
    );
    this.#registers.flagCarry = result > 0xff;
    this.#registers[r8] = result & 0xff;
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #sbc(r8) {
    const result =
      this.#registers.A - this.#registers[r8] - +this.#registers.flagCarry;
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = true;
    this.#registers.flagHalfCarry =
      (this.#registers.A & 0xf) -
        (this.#registers[r8] & 0xf) -
        +this.#registers.flagCarry <
      0;
    this.#registers.flagCarry = result < 0;
    this.#registers.A = result & 0xff;
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   * @param  {number} value
   */
  #adcVal(r8, value) {
    const result = this.#registers[r8] + value + +this.#registers.flagCarry;
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = readBit(
      (this.#registers[r8] & 0xf) + (value & 0xf) + +this.#registers.flagCarry,
      4,
    );
    this.#registers.flagCarry = result > 0xff;
    this.#registers[r8] = result & 0xff;
  }

  /**
   * @param {number} value
   */
  #sbcVal(value) {
    const result = this.#registers.A - value - +this.#registers.flagCarry;
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = true;
    this.#registers.flagHalfCarry =
      (this.#registers.A & 0xf) - (value & 0xf) - +this.#registers.flagCarry <
      0;
    this.#registers.flagCarry = result < 0;
    this.#registers.A = result & 0xff;
  }

  /**
   * @param  {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #sub(r8) {
    const result = this.#registers.A - this.#registers[r8];
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = true;
    this.#registers.flagHalfCarry = isHalfBorrow8(
      this.#registers.A,
      this.#registers[r8],
    );
    this.#registers.flagCarry = result < 0;
    this.#registers.A = result & 0xff;
  }

  /**
   * @param  {number} value
   */
  #subVal(value) {
    const result = this.#registers.A - value;
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = true;
    this.#registers.flagHalfCarry = isHalfBorrow8(this.#registers.A, value);
    this.#registers.flagCarry = result < 0;
    this.#registers.A = result & 0xff;
  }

  #jr() {
    const offset = this.#memory.readByte(this.#registers.PC, true);
    this.#registers.PC = (this.#registers.PC + 1 + offset) & 0xffff;
  }

  /**
   * @param {number} val
   */
  #and(val) {
    this.#registers.A &= val;
    this.#registers.flagZero = this.#registers.A === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = true;
    this.#registers.flagCarry = false;
  }

  /**
   * @param {number} val
   */
  #or(val) {
    this.#registers.A |= val;
    this.#registers.flagZero = this.#registers.A === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = false;
  }

  /**
   * @param {number} val
   */
  #xor(val) {
    this.#registers.A ^= val;
    this.#registers.flagZero = this.#registers.A === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = false;
  }

  /**
   * @param {number} val
   */
  #cp(val) {
    const result = this.#registers.A - val;
    this.#registers.flagZero = (result & 0xff) == 0;
    this.#registers.flagSubtract = true;
    this.#registers.flagHalfCarry = isHalfBorrow8(this.#registers.A, val);
    this.#registers.flagCarry = result < 0;
  }

  /**
   * @param {number} val
   */
  #push(val) {
    this.#registers.SP -= 2;
    this.#memory.writeWord(this.#registers.SP, val);
  }

  /**
   * @param {number} val
   */
  #call(val) {
    this.#push(this.#registers.PC + 2);
    this.#registers.PC = val;
  }

  #rst(val) {
    this.#registers.SP -= 2;
    this.#memory.writeWord(this.#registers.SP, this.#registers.PC);
    this.#registers.PC = val;
  }

  #pop() {
    const val = this.#memory.readWord(this.#registers.SP);
    this.#registers.SP += 2;
    return val;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #rlc(r8) {
    const result = rotateLeft8(this.#registers[r8]);
    this.#registers[r8] = result;
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = (result & 1) === 1;
  }

  /**
   * @param {number} ref
   */
  #rlcRef(ref) {
    const value = this.#memory.readByte(ref);
    const result = rotateLeft8(value);
    this.#memory.writeByte(ref, result);
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = (result & 1) === 1;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #rrc(r8) {
    const result = rotateRight8(this.#registers[r8]);
    this.#registers[r8] = result;
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = (result & 0b10000000) === 0b10000000;
  }

  /**
   * @param {number} ref
   */
  #rrcRef(ref) {
    const value = this.#memory.readByte(ref);
    const result = rotateRight8(value);
    this.#memory.writeByte(ref, result);
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = (result & 0b10000000) === 0b10000000;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #rl(r8) {
    const [result, leftBit] = rotateThroughCarryLeft8(
      this.#registers[r8],
      this.#registers.flagCarry,
    );
    this.#registers[r8] = result;
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = leftBit === 1;
  }

  /**
   * @param {number} ref
   */
  #rlRef(ref) {
    const value = this.#memory.readByte(ref);
    const [result, leftBit] = rotateThroughCarryLeft8(
      value,
      this.#registers.flagCarry,
    );
    this.#memory.writeByte(ref, result);
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = leftBit === 1;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #rr(r8) {
    const [result, rightBit] = rotateThroughCarryRight8(
      this.#registers[r8],
      this.#registers.flagCarry,
    );
    this.#registers[r8] = result;
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = rightBit === 1;
  }

  /**
   * @param {number} ref
   */
  #rrRef(ref) {
    const value = this.#memory.readByte(ref);
    const [result, rightBit] = rotateThroughCarryRight8(
      value,
      this.#registers.flagCarry,
    );
    this.#memory.writeByte(ref, result);
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = rightBit === 1;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #sla(r8) {
    const [result, leftBit] = shiftLeft8(this.#registers[r8]);
    this.#registers[r8] = result;
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = leftBit === 1;
  }

  /**
   * @param {number} ref
   */
  #slaRef(ref) {
    const value = this.#memory.readByte(ref);
    const [result, leftBit] = shiftLeft8(value);
    this.#memory.writeByte(ref, result);
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = leftBit === 1;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #sra(r8) {
    let [result, rightBit] = shiftRight8(this.#registers[r8]);
    if (this.#registers[r8] & 0b10000000) {
      result += 0b10000000;
    }
    this.#registers[r8] = result;
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = rightBit === 1;
  }

  /**
   * @param {number} ref
   */
  #sraRef(ref) {
    const value = this.#memory.readByte(ref);
    let [result, rightBit] = shiftRight8(value);
    if (value & 0b10000000) {
      result += 0b10000000;
    }
    this.#memory.writeByte(ref, result);
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = rightBit === 1;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #swap(r8) {
    const value = this.#registers[r8];
    const result = (value >> 4) + ((value & 0xf) << 4);
    this.#registers[r8] = result & 0xff;
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = false;
  }

  /**
   * @param {number} ref
   */
  #swapRef(ref) {
    const value = this.#memory.readByte(ref);
    const result = (value >> 4) + ((value & 0xf) << 4);
    this.#memory.writeByte(ref, result);
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = false;
  }

  /**
   * @param {'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L'} r8
   */
  #srl(r8) {
    const [result, rightBit] = shiftRight8(this.#registers[r8]);
    this.#registers[r8] = result;
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = rightBit === 1;
  }

  /**
   * @param {number} ref
   */
  #srlRef(ref) {
    const value = this.#memory.readByte(ref);
    const [result, rightBit] = shiftRight8(value);
    this.#memory.writeByte(ref, result);
    this.#registers.flagZero = result === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = false;
    this.#registers.flagCarry = rightBit === 1;
  }

  /**
   * @param {number} bit
   * @param {number} value
   */
  #bit(bit, value) {
    this.#registers.flagZero = (value & (1 << bit)) === 0;
    this.#registers.flagSubtract = false;
    this.#registers.flagHalfCarry = true;
  }

  #res(bit, r8) {
    this.#registers[r8] &= 0xff - (1 << bit);
  }

  #resRef(bit, ref) {
    const value = this.#memory.readByte(ref);
    this.#memory.writeByte(ref, value & (0xff - (1 << bit)));
  }

  #set(bit, r8) {
    this.#registers[r8] |= 1 << bit;
  }

  #setRef(bit, ref) {
    const value = this.#memory.readByte(ref);
    this.#memory.writeByte(ref, value | (1 << bit));
  }
}

export { CPU };
