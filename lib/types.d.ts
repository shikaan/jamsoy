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
  value?: number;
}

interface Instruction {
  mnemonic: string;
  bytes: number;
  cycles: number[];
  operands: Operand[];
  immediate: boolean;
  flags: Object;
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

interface Register {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
  H: number;
  L: number;
  SP: number;
  PC: number;
  AF: number;
  BC: number;
  DE: number;
  HL: number;
  flagCarry: boolean;
  flagHalfCarry: boolean;
  flagSubtract: boolean;
  flagZero: boolean;
  reset(): void;
}

type InstructionExecutor = (i: Instruction, r: Register, d: Uint8Array) => number

export { CartridgeMetadata, Instruction, Operand, Register }