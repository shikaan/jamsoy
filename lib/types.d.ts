import { Memory } from "./memory.mjs";
import { CPU } from "./cpu/cpu.mjs";
import { Interrupts } from "./interrupts.mjs";
import { Screen } from "./gfx/screen.mjs";
import { PPU } from "./gfx/ppu.mjs";
import { CPURegisters } from "./cpu/registers.mjs";
import { Decoder } from "./decoder/instruction.mjs";
import { Input } from "./input.mjs";

interface RawInstruction {
  mnemonic: string;
  bytes: number;
  cycles: number[];
  operands: RawOperand[];
  immediate: boolean;
  flags: Object;
}

interface RawOperand {
  name: string;
  immediate: boolean;
  bytes?: number;
}

interface Operand {
  name: string;
  immediate: boolean;
  increment?: boolean;
  decrement?: boolean;
  value?: number;
}

interface Instruction {
  mnemonic: string;
  bytes: number;
  cycles: number[];
  operands: Operand[];
  immediate: boolean;
  flags: Object;
  opcode: number;
}

interface CartridgeMetadata {
  entryPoint: Uint8Array;
  nintendoLogo: Uint8Array;
  title: string;
  colorMode: ColorMode;
  newLicenseeCode: number;
  sgb: boolean;
  type: number;
  romSize: number;
  ramSize: number;
  destination: number;
  oldLicenseeCode: number;
  maskROMVersion: number;
  headerChecksum: number;
  globalChecksum: number;
}

enum ColorMode {
  NoColor,
  Compatible,
  ColorOnly,
  PGB,
}

type InstructionExecutor = (i: Instruction, r: Register, d: Memory) => number;

export {
  CartridgeMetadata,
  Instruction,
  Operand,
  CPURegisters,
  Decoder,
  Memory,
  InstructionExecutor,
  CPU,
  Interrupts,
  Screen,
  PPU,
  Input,
};
