// @ts-check
import fs from 'node:fs';
import { argv } from 'node:process';
import readline from 'node:readline';

import { CPU } from '../lib/cpu/cpu.mjs';
import { Memory } from '../lib/memory.mjs';
import { format } from '../lib/format.mjs';
import { Interrupts } from '../lib/interrupts.mjs';
import { register } from '../lib/cpu/registers.mjs';
import { Timer } from '../lib/timer.mjs';

const file = argv[2];
const cartridge = fs.readFileSync(file);

const memory = new Memory()
const interrupts = new Interrupts(memory, register);
const cpu = new CPU(memory, register, interrupts);
const timer = new Timer(memory, cpu);

const logfile = fs.createWriteStream('test.log', { flags: 'w' });

memory.onSerial(process.stdout.write.bind(process.stdout));
memory.initialize();
memory.loadROM(cartridge);
cpu.initialize();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

//clear terminal
process.stdout.write('\x1Bc');

console.log(`[F8]: next instruction, [F9]: next N instructions, [F10]: run and dump logs, [R]: registers, [M]: memory, [CTRL+C]: exit`);

process.stdin.setRawMode(true);

let cycles = 0;
let instructions = BigInt(0);
function tick(debug) {
  interrupts.handleInterrupts();
  instructions++;
  cycles += cpu.executeNextIntruction(debug);
  timer.update(cycles);

  if (cycles >= CPU.MAX_CYCLES) {
    cycles = 0;
  }
}

let isProcessingAnotherCommand = false;
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  }

  if (isProcessingAnotherCommand) return;

  if (key.name === 'f8') {
    isProcessingAnotherCommand = true;
    process.stdout.clearLine(0);
    tick(true);
    isProcessingAnotherCommand = false;
  }
  else if (key.name === 'f9') {
    isProcessingAnotherCommand = true;
    process.stdout.clearLine(0);
    rl.question('  > Number of instructions to run: ', (n) => {
      const total = BigInt(n);
      const loop = () => {
        // print last 10 instructions before stopping
        tick(instructions > (total - 10n));
        if (instructions < total) {
          setImmediate(loop);
        } else {
          isProcessingAnotherCommand = false;
        }
      }
      loop();
    });
  }
  else if (key.name === 'f10') {
    isProcessingAnotherCommand = true;
    console.log('Running instruction and dumping logs...');
    process.stdout.clearLine(0);
    const loop = () => {
      printInlineRegisters(logfile);
      tick(false);
      setImmediate(loop);
    }
    loop();
    isProcessingAnotherCommand = false;
  }
  else if (key.name === 'r') {
    isProcessingAnotherCommand = true;
    process.stdout.cursorTo(0)
    printInlineRegisters(process.stdout);
    isProcessingAnotherCommand = false;
  }
  else if (key.name === 'm') {
    isProcessingAnotherCommand = true;
    process.stdout.clearLine(0);
    rl.question('  > Memory address: ', (address) => {
      const addr = Number.parseInt(address.trim(), 16);
      console.log(`  >> memory[%s] = %s`, format.hex(addr), format.hex(memory.readByte(addr)));
      console.log(`  >> memory[%s] = %s`, format.hex(addr), format.hex(memory.readWord(addr)));
      isProcessingAnotherCommand = false;
    });
  }
});

rl.on('close', () => {
  process.exit(0);
});

const hex = (value, pad) => value.toString(16).toUpperCase().padStart(pad, '0');
function printInlineRegisters(stream) {
  const result = [
    `A:${hex(+register.A, 2)}`,
    `F:${hex(+register.F, 2)}`,
    `B:${hex(+register.B, 2)}`,
    `C:${hex(+register.C, 2)}`,
    `D:${hex(+register.D, 2)}`,
    `E:${hex(+register.E, 2)}`,
    `H:${hex(+register.H, 2)}`,
    `L:${hex(+register.L, 2)}`,
    `SP:${hex(+register.SP, 4)}`,
    `PC:${hex(+register.PC, 4)}`,
    `PCMEM:${hex(+memory.readByte(+register.PC), 2)},${hex(+memory.readByte(+register.PC + 1), 2)},${hex(+memory.readByte(+register.PC + 2), 2)},${hex(+memory.readByte(+register.PC + 3), 2)}`,
  ]

  stream.write(result.join(' ') + '\n');
}