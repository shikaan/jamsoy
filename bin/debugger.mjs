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

memory.onWrite(0xFF02, (v) => {
  console.log('0xFF02');
  if (v === 0x81) {
    process.stdout.write(String.fromCharCode(memory.readByte(0xFF01)));
  }
});

memory.initialize();
cpu.initialize();
memory.loadROM(cartridge);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

//clear terminal
process.stdout.write('\x1Bc');

console.log("[F8]: execute next instruction, [F9]: execute next frame, [F10]: run, [R]: registers, [M]: memory, [CTRL+C]: exit");

process.stdin.setRawMode(true);

const rom = memory.getROM();

let cycles = 0;
let isProcessingAnotherCommand = false;
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  }

  if (isProcessingAnotherCommand) return;

  if (key.name === 'f8') {
    isProcessingAnotherCommand = true;
    process.stdout.clearLine(0);
    cycles += cpu.executeNextIntruction(rom);
    timer.update(cycles);
    interrupts.handleInterrupts();

    if (cycles >= CPU.MAX_CYCLES) {
      cycles = 0;
    }
    isProcessingAnotherCommand = false;
  }
  else if (key.name === 'f9') {
    isProcessingAnotherCommand = true;
    process.stdout.clearLine(0);
    while (cycles < CPU.MAX_CYCLES) {
      cycles += cpu.executeNextIntruction(rom);
      timer.update(cycles);
      interrupts.handleInterrupts();
    }
    cycles = 0;
    isProcessingAnotherCommand = false;
  }
  else if (key.name === 'f10') {
    isProcessingAnotherCommand = true;
    process.stdout.clearLine(0);
    while (true) {
      cycles += cpu.executeNextIntruction(rom);
      timer.update(cycles);
      interrupts.handleInterrupts();
      if (cycles >= CPU.MAX_CYCLES) {
        cycles = 0;
      }
    }
    isProcessingAnotherCommand = false;
  }
  else if (key.name === 'r') {
    isProcessingAnotherCommand = true;
    process.stdout.cursorTo(0)
    printRegisters()
    isProcessingAnotherCommand = false;
  }
  else if (key.name === 'm') {
    isProcessingAnotherCommand = true;
    process.stdout.clearLine(0);
    rl.question('  > Memory address: ', (address) => {
      const addr = Number.parseInt(address.trim(), 16);
      console.log(`  >> memory[%s] = %s`, format.hex(addr), format.hex(memory.readByte(addr)));
      isProcessingAnotherCommand = false;
    });
  }
});

rl.on('close', () => {
  process.exit(0);
});

function printRegisters() {
  console.log(`  > Registers:`);
  for (const [key, value] of Object.entries(register)) {
    if (key != 'reset') {
      console.log(`  >> ${key}: ${format.hex(+value)}`);
    }
  }
}