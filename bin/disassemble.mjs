import fs from 'node:fs';
import { argv } from 'node:process';
import { getMetadata } from '../lib/cartridge.mjs';
import { decode } from '../lib/cpu/decoder.mjs';
import { format } from '../lib/format.mjs';

const file = argv[2];
const instructions = argv[3] ?? 16;
const cartridge = fs.readFileSync(file);

const { nintendoLogo, entryPoint, ...meta } = getMetadata(cartridge);

console.table(meta);
console.log("Disassembling %d instructions...\n", instructions);
let address = 0x150;
for (let i = 0; i < instructions; i++) {
  const [add, inst] = decode(address, cartridge)
  console.log(format.hex(address).padEnd(8, ' '), format.instruction(inst))
  address = add;
}