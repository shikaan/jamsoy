// Mock data and helper functions
const makeData = () => new Uint8Array(256).fill(0).map((_, index) => index); // Mock memory data
/**
 * @returns {import('../lib/types').Register}
 */
const makeEmptyRegister = () => /** @type{import('../lib/types').Register} */({
  A: 0x00,
  B: 0x00,
  HL: 0x0000,
  SP: 0x0000,
  flagZero: false,
  flagSubtract: false,
  flagCarry: false,
  flagHalfCarry: false
});

export { makeData, makeEmptyRegister }