import fs from 'node:fs';
import { argv } from 'node:process';
import { getMetadata } from '../lib/cartridge.mjs';
import { run } from '../lib/cpu.mjs';
import { register } from '../lib/registers.mjs';

const file = argv[2];
const instructions = argv[3] ?? 16;
const cartridge = fs.readFileSync(file);

const { nintendoLogo, entryPoint, ...meta } = getMetadata(cartridge);

register.PC = 0x0100;
for (let i = 0; i < instructions; i++) {
  run(cartridge)
}