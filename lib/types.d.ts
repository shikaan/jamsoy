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
export { CartridgeMetadata, Instruction, Operand }