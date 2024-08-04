// @ts-check

// AF, BC, DE, HL, SP, PC
const REGISTERS = new Uint16Array(6);

/**
 * Returns the higher byte of a Uint16
 * @param {number} i 
 * @returns {number}
 */
const readHigh = (i) => i >> 8;

/**
 * Returns the lower byte of a Uint16
 * @param {number} i 
 * @returns {number}
 */
const readLow = (i) => i & 0x0FF;

/**
 * Returns the `n`-th bit of the Uint16 `i`
 * @param {number} i 
 * @param {number} n 
 * @returns {boolean}
 */
const readBit = (i, n) => /** @type {boolean} */!!(i >> n & 1);

/**
 * Returns the Uint16 `i` with `value` written in the higher byte
 * @param {number} i 
 * @param {number} value 
 * @returns {number}
 */
const writeHigh = (i, value) => {
  const low = readLow(i)
  const high = value << 8
  // The & 0xFFFF at the end guarantees that the result stays in 16-bit
  return (low | high) & 0xFFFF;
}

/**
 * Returns the Uint16 `i` with `value` written in the lower byte
 * @param {number} i 
 * @param {number} value 
 * @returns {number}
 */
const writeLow = (i, value) => {
  const high = readHigh(i);
  const low = value & 0xFF;
  // The & 0xFFFF at the end guarantees that the result stays in 16-bit
  return (low | high) & 0xFFFF;
}

/**
 * Sets the value of the n-th bit of a 16-bit unsigned integer.
 * @param {number} i - The original 16-bit unsigned integer.
 * @param {number} n - The bit position to set (0-15).
 * @param {boolean} value - The value to set at the n-th bit (0 or 1).
 * @returns {number} The modified 16-bit unsigned integer.
 */
const writeBit = (i, n, value) => {
  i &= ~(1 << n); // reset the n-th bit
  if (value === true) {
    i |= (1 << n); // set the n-th bit
  }
  return i;
}

const register = {
  get a() { return readHigh(REGISTERS[0]) },
  set a(uint8) { REGISTERS[0] = writeHigh(REGISTERS[0], uint8) },

  get b() { return readHigh(REGISTERS[1]) },
  set b(uint8) { REGISTERS[1] = writeHigh(REGISTERS[1], uint8) },

  get c() { return readLow(REGISTERS[1]) },
  set c(uint8) { REGISTERS[1] = writeLow(REGISTERS[1], uint8) },

  get d() { return readHigh(REGISTERS[2]) },
  set d(uint8) { REGISTERS[2] = writeHigh(REGISTERS[2], uint8) },

  get e() { return readLow(REGISTERS[2]) },
  set e(uint8) { REGISTERS[2] = writeLow(REGISTERS[2], uint8) },

  get f() { return readLow(REGISTERS[0]) },
  set f(uint8) { REGISTERS[0] = writeLow(REGISTERS[0], uint8) },

  get h() { return readHigh(REGISTERS[3]) },
  set h(uint8) { REGISTERS[3] = writeHigh(REGISTERS[3], uint8) },

  get l() { return readLow(REGISTERS[3]) },
  set l(uint8) { REGISTERS[3] = writeLow(REGISTERS[3], uint8) },

  get sp() { return REGISTERS[4] },
  set sp(uint16) { REGISTERS[4] = uint16 },

  get pc() { return REGISTERS[5] },
  set pc(uint16) { REGISTERS[5] = uint16 },

  get af() { return REGISTERS[0] },
  set af(uint16) { REGISTERS[0] = uint16 },

  get bc() { return REGISTERS[1] },
  set bc(uint16) { REGISTERS[1] = uint16 },

  get de() { return REGISTERS[2] },
  set de(uint16) { REGISTERS[2] = uint16 },

  get hl() { return REGISTERS[3] },
  set hl(uint16) { REGISTERS[3] = uint16 },

  get flagCarry() { return readBit(REGISTERS[0], 4); },
  set flagCarry(b) { REGISTERS[0] = writeBit(REGISTERS[0], 4, b) },

  get flagHalfCarry() { return readBit(REGISTERS[0], 5); },
  set flagHalfCarry(b) { REGISTERS[0] = writeBit(REGISTERS[0], 5, b) },

  get flagSubtract() { return readBit(REGISTERS[0], 6); },
  set flagSubtract(b) { REGISTERS[0] = writeBit(REGISTERS[0], 6, b) },

  get flagZero() { return readBit(REGISTERS[0], 7); },
  set flagZero(b) { REGISTERS[0] = writeBit(REGISTERS[0], 7, b) },

  reset() { REGISTERS.fill(0) }
}

export { register }