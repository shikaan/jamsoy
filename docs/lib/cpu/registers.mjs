import { readBit } from "../utils/bits.mjs";

// @ts-check
class CPURegisters {
  // AF, BC, DE, HL, SP, PC
  REGISTERS_16 = new Uint16Array(2);

  // A, B, C, D, E, H, L. F is represented with booleans
  REGISTERS_8 = new Uint8Array(7);

  flagZero = false;
  flagSubtract = false;
  flagHalfCarry = false;
  flagCarry = false;

  get A() {
    return this.REGISTERS_8[0];
  }
  set A(uint8) {
    this.REGISTERS_8[0] = uint8;
  }

  get B() {
    return this.REGISTERS_8[1];
  }
  set B(uint8) {
    this.REGISTERS_8[1] = uint8;
  }

  get C() {
    return this.REGISTERS_8[2];
  }
  set C(uint8) {
    this.REGISTERS_8[2] = uint8;
  }

  get D() {
    return this.REGISTERS_8[3];
  }
  set D(uint8) {
    this.REGISTERS_8[3] = uint8;
  }

  get E() {
    return this.REGISTERS_8[4];
  }
  set E(uint8) {
    this.REGISTERS_8[4] = uint8;
  }

  get F() {
    return (
      (+this.flagZero << 7) |
      (+this.flagSubtract << 6) |
      (+this.flagHalfCarry << 5) |
      (+this.flagCarry << 4)
    );
  }

  get H() {
    return this.REGISTERS_8[5];
  }
  set H(uint8) {
    this.REGISTERS_8[5] = uint8;
  }

  get L() {
    return this.REGISTERS_8[6];
  }
  set L(uint8) {
    this.REGISTERS_8[6] = uint8;
  }

  get SP() {
    return this.REGISTERS_16[0];
  }
  set SP(uint16) {
    this.REGISTERS_16[0] = uint16;
  }

  get PC() {
    return this.REGISTERS_16[1];
  }
  set PC(uint16) {
    this.REGISTERS_16[1] = uint16;
  }

  get AF() {
    return (this.A << 8) | this.F;
  }
  set AF(uint16) {
    this.A = uint16 >> 8;
    const F = uint16 & 0xff;
    this.flagZero = readBit(F, 7);
    this.flagSubtract = readBit(F, 6);
    this.flagHalfCarry = readBit(F, 5);
    this.flagCarry = readBit(F, 4);
  }

  get BC() {
    return (this.B << 8) | this.C;
  }
  set BC(uint16) {
    this.B = uint16 >> 8;
    this.C = uint16 & 0xff;
  }

  get DE() {
    return (this.D << 8) | this.E;
  }
  set DE(uint16) {
    this.D = uint16 >> 8;
    this.E = uint16 & 0xff;
  }

  get HL() {
    return (this.H << 8) | this.L;
  }
  set HL(uint16) {
    this.H = uint16 >> 8;
    this.L = uint16 & 0xff;
  }

  initialize() {
    this.REGISTERS_8.fill(0);
    this.REGISTERS_16.fill(0);
    this.flagZero = false;
    this.flagSubtract = false;
    this.flagHalfCarry = false;
    this.flagCarry = false;
  }
}

export { CPURegisters };
