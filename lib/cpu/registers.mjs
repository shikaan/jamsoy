// @ts-check

// AF, BC, DE, HL, SP, PC
const REGISTERS_16 = new Uint16Array(2);
const REGISTERS_8 = new Uint8Array(7); // A, B, C, D, E, H, L. F is represented with booleans

/**
 * Returns the `n`-th bit of the Uint16 `i`
 * @param {number} i
 * @param {number} n
 * @returns {boolean}
 */
const readBit = (i, n) => /** @type {boolean} */ !!((i >> n) & 1);

/**
 * Sets the value of the n-th bit of an unsigned integer.
 * @param {number} i - The initial unsigned integer.
 * @param {number} n - The bit position to set (0-15).
 * @param {boolean} value - The value to set at the n-th bit (true/false).
 * @returns {number} The modified unsigned integer.
 */
const writeBit = (i, n, value) => {
  i &= ~(1 << n); // reset the n-th bit
  if (value === true) {
    i |= 1 << n; // set the n-th bit
  }
  return i;
};

const register = {
  flagZero: false,
  flagSubtract: false,
  flagHalfCarry: false,
  flagCarry: false,

  get A() {
    return REGISTERS_8[0]
  },
  set A(uint8) {
    REGISTERS_8[0] = uint8;
  },

  get B() {
    return REGISTERS_8[1]
  },
  set B(uint8) {
    REGISTERS_8[1] = uint8;
  },

  get C() {
    return REGISTERS_8[2]
  },
  set C(uint8) {
    REGISTERS_8[2] = uint8;
  },

  get D() {
    return REGISTERS_8[3]
  },
  set D(uint8) {
    REGISTERS_8[3] = uint8;
  },

  get E() {
    return REGISTERS_8[4]
  },
  set E(uint8) {
    REGISTERS_8[4] = uint8;
  },

  get F() {
    return +this.flagZero << 7 | +this.flagSubtract << 6 | +this.flagHalfCarry << 5 | +this.flagCarry << 4;
  },

  get H() {
    return REGISTERS_8[5];
  },
  set H(uint8) {
    REGISTERS_8[5] = uint8;
  },

  get L() {
    return REGISTERS_8[6];
  },
  set L(uint8) {
    REGISTERS_8[6] = uint8;
  },

  get SP() {
    return REGISTERS_16[0];
  },
  set SP(uint16) {
    REGISTERS_16[0] = uint16;
  },

  get PC() {
    return REGISTERS_16[1];
  },
  set PC(uint16) {
    REGISTERS_16[1] = uint16;
  },

  get AF() {
    return this.A << 8 | this.F;
  },
  set AF(uint16) {
    this.A = uint16 >> 8;
    const F = uint16 & 0xFF;
    this.flagZero = readBit(F, 7);
    this.flagSubtract = readBit(F, 6);
    this.flagHalfCarry = readBit(F, 5);
    this.flagCarry = readBit(F, 4);
  },

  get BC() {
    return this.B << 8 | this.C;
  },
  set BC(uint16) {
    this.B = uint16 >> 8;
    this.C = uint16 & 0xFF;
  },

  get DE() {
    return this.D << 8 | this.E;
  },
  set DE(uint16) {
    this.D = uint16 >> 8;
    this.E = uint16 & 0xFF;
  },

  get HL() {
    return this.H << 8 | this.L;
  },
  set HL(uint16) {
    this.H = uint16 >> 8;
    this.L = uint16 & 0xFF;
  },

  reset() {
    REGISTERS_8.fill(0);
    REGISTERS_16.fill(0);
    this.flagZero = false;
    this.flagSubtract = false;
    this.flagHalfCarry = false;
    this.flagCarry = false;
  },
};

const GENERAL_PURPOSE_R8 = ["A", "B", "C", "D", "E", "H", "L"];
const GENERAL_PURPOSE_R16 = ["BC", "DE", "HL"];
const GENERAL_PURPOSE = GENERAL_PURPOSE_R8.concat(GENERAL_PURPOSE_R16);

export { register, writeBit, readBit, GENERAL_PURPOSE_R16, GENERAL_PURPOSE_R8, GENERAL_PURPOSE };
