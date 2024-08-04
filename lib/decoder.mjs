import { createRequire } from "module";
const opcodes = createRequire(import.meta.url)("./opcodes.json");

/**
 * @import('types.d.ts')
 */

const PREFIXED = new Array(256)
Object
  .entries(opcodes.cbprefixed)
  .forEach(([k, v]) => PREFIXED[Number.parseInt(k, 16)] = v);

const UNPREFIXED = new Array(256)
Object
  .entries(opcodes.unprefixed)
  .forEach(([k, v]) => UNPREFIXED[Number.parseInt(k, 16)] = v);

// This byte is used to signal prefix instructions. When found,
// move ahead and use intruction from PREFIXED list.
const PREFIX_BYTE = 0xCB

function readNextInstruction(data, address, instructions) {
  let opcode = data[address];
  let instruction = instructions[opcode];
  address++;
  return [opcode, instruction, address];
}

/**
 * Decodes the instruction at a given address
 * @param {number} address 
 * @param {Uint8Array} data
 * @returns {[number, import('./types').Instruction]}
 */
function decode(address, data) {
  if (address >= data.length) throw new Error('Invalid address');

  let opcode = data[address];
  let instruction = UNPREFIXED[opcode];
  address++;

  if (opcode === PREFIX_BYTE) {
    opcode = data[address];
    instruction = PREFIXED[opcode];
    address++;
  }

  const operands = instruction.operands.map(({ bytes, ...operand }) => {
    if (bytes) {
      // GameBoy operates 16-bit address bus, we need to cater for both 8 and 16
      const value = bytes == 1
        ? data.readUint8(address)
        : data.readUint16LE(address);
      address += bytes;
      return { ...operand, value }
    }

    return operand;
  })

  return [address, { ...instruction, operands }]
}

export { decode }