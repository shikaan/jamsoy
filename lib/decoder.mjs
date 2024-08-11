// @ts-check
import { createRequire } from "module";
const opcodes = createRequire(import.meta.url)("./opcodes.json");

const PREFIXED = new Array(256)
Object
  .entries(opcodes.cbprefixed)
  .forEach(([k, v]) => PREFIXED[Number.parseInt(k, 16)] = v);

const UNPREFIXED = new Array(256)
Object
  .entries(opcodes.unprefixed)
  .forEach(([k, v]) => UNPREFIXED[Number.parseInt(k, 16)] = v);

// This is used to signal prefix instructions. When found,
// move ahead and use intruction from PREFIXED list.
const PREFIX_MNEMONIC = "PREFIX"

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

  if (instruction.mnemonic === PREFIX_MNEMONIC) {
    opcode = data[address];
    instruction = PREFIXED[opcode];
    address++;
  }

  const view = new DataView(data.buffer);
  const operands = instruction.operands.map(({ bytes, ...operand }) => {
    if (bytes) {
      let value;
      switch (operand.name) {
        case 'n16':
        case 'a16':
          value = view.getUint16(address, true);
          break;
        case 'n8':
          value = view.getUint8(address);
          break;
        case 'e8':
          value = view.getInt8(address);
          break;
        default:
          throw new Error(`Unknown operand: ${operand.name}`);
      }
      address += bytes;
      return { ...operand, value }
    }

    return operand;
  })

  return [address, { ...instruction, operands, opcode }];
}

export { decode }