// @ts-check

/**
 * Checks if a half carry occurred when adding two 8-bit numbers
 * @param {number} oldVal
 * @param {number} newVal
 */
const isHalfCarry8 = (oldVal, newVal) => (oldVal & 0xf) + (newVal & 0xf) > 0xf;
/**
 * Checks if a half carry occurred when adding two 16-bit numbers.
 */
const isHalfCarry16 = (oldVal, newVal) =>
  (oldVal & 0xfff) + (newVal & 0xfff) > 0xfff;
/**
 * Checks if a half borrow occurred when subtracting two 8-bit numbers.
 */
const isHalfBorrow8 = (oldVal, newVal) => (oldVal & 0xf) - (newVal & 0xf) < 0;

/**
 * Rotates an 8-bit number to the left.
 */
const rotateLeft8 = (/** @type {number} */ x) =>
  (0b10000000 & x) == 0 ? x << 1 : (x << 1) + 1;
/**
 * Rotates an 8-bit number to the right.
 */
const rotateRight8 = (/** @type {number} */ x) =>
  (1 & x) == 0 ? x >> 1 : (x >> 1) + 0b10000000;

const rotateThroughCarryLeft8 = (
  /** @type {number} */ x,
  /** @type {boolean} */ carry,
) => {
  const result = (x << 1) + +carry;
  return [result & 0xff, x >> 7];
};
const rotateThroughCarryRight8 = (
  /** @type {number} */ x,
  /** @type {boolean} */ carry,
) => {
  const result = (x >> 1) + (+carry << 7);
  return [result & 0xff, x & 1];
};
const shiftLeft8 = (/** @type {number} */ x) => [(x << 1) & 0xff, x >> 7];
const shiftRight8 = (/** @type {number} */ x) => [(x >> 1) & 0xff, x & 1];

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

export {
  isHalfCarry8,
  isHalfCarry16,
  isHalfBorrow8,
  rotateLeft8,
  rotateRight8,
  rotateThroughCarryLeft8,
  rotateThroughCarryRight8,
  shiftLeft8,
  shiftRight8,
  readBit,
  writeBit,
};
