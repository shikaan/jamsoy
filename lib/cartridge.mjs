// @ts-check

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

// const NINTENDO_LOGO = new Uint8Array([
//   206, 237, 102, 102, 204, 13, 0, 11, 3, 115,
//   0, 131, 0, 12, 0, 13, 0, 8, 17, 31,
//   136, 137, 0, 14, 220, 204, 110, 230, 221, 221,
//   217, 153, 187, 187, 103, 99, 110, 14, 236, 204,
//   221, 220, 153, 159, 187, 185, 51, 62
// ])

/**
 * @enum {number}
 */
export const ROMBanking = {
  NoBanking: 0,
  MBC1: 1,
  MBC2: 2,
};

/**
 * @enum {number}
 */
const ColorMode = {
  NoColor: 0,
  Compatible: 1,
  ColorOnly: 2,
  PGB: 3, // Not used
};

/**
 * @enum {number}
 */
const Destination = {
  Japan: 0,
  Overseas: 1,
};

const RAM_BYTE_TO_SIZE = [
  0,
  0, // This should be unused
  8 * 1024,
  32 * 1024,
  128 * 1024,
  64 * 1024,
  // Not an error, it's in this order in the specs
];

const DESTINATION_BYTE_TO_DESTINATION = [
  Destination.Japan,
  Destination.Overseas,
];

const textDecoder = new TextDecoder('utf-8');
/**
 * @param {Uint8Array} data
 * @returns {import('./types').CartridgeMetadata}
 */
function getMetadata(data) {
  const view = new DataView(data.buffer);

  // TODO: these all need validation
  const entryPoint = data.slice(0x100, 0x104);
  const nintendoLogo = data.slice(0x0104, 0x0134);
  const title = textDecoder.decode(data.slice(0x134, 0x143));

  const cgb = data[0x143];
  const colorMode =
    cgb === 0x80
      ? ColorMode.Compatible
      : cgb === 0xc0
        ? ColorMode.ColorOnly
        : ColorMode.NoColor;

  const newLicenseeCode = view.getUint16(0x0144, true);
  const sgb = data[0x0146] === 0x03;

  // TODO: map all the cartridge types
  let type;
  switch (data[0x0147]) {
    case 0x00:
      type = ROMBanking.NoBanking; break;
    case 0x01:
    case 0x02:
    case 0x03:
      type = ROMBanking.MBC1; break;
    case 0x05:
    case 0x06:
      type = ROMBanking.MBC2; break;
    default:
      throw new Error(`Unsupported cartridge type: ${data[0x0147]}`);
  };

  console.warn(`Unexpected ROM type; got 0x${type.toString(16)}, wanted 0x00`)

  assert(data[0x0148] < 9, "Invalid ROM size.");
  const romSize = 32 * 1024 * (1 << data[0x0148]);

  const ramSize = RAM_BYTE_TO_SIZE[data[0x0149]] ?? 0;
  // TODO: this should be zero only if type does not have RAM. Cross check types once they are all mapped

  const destination = DESTINATION_BYTE_TO_DESTINATION[data[0x014a]];
  assert(
    destination === 0 || destination === 1,
    `Invalid destination; expected 0x00 or 0x01, got 0x${data[0x014a].toString(16)}.`,
  );

  const oldLicenseeCode = data[0x014b];
  const maskROMVersion = data[0x014c];

  // TODO: implement checksum validations
  const headerChecksum = data[0x014d];
  const globalChecksum = view.getUint16(0x014e, false);

  return {
    entryPoint,
    nintendoLogo,
    title,
    colorMode,
    newLicenseeCode,
    sgb,
    type,
    romSize,
    ramSize,
    destination,
    oldLicenseeCode,
    maskROMVersion,
    headerChecksum,
    globalChecksum,
  };
}

function formatMetadata(metadata) {
  const colorMode = (mode) => Object.keys(ColorMode).find((key) => ColorMode[key] === mode);
  const type = (type) => Object.keys(ROMBanking).find((key) => ROMBanking[key] === type);

  return [
    `  Title: ${metadata.title}`,
    `  Color Mode: ${colorMode(metadata.colorMode)}`,
    `  SGB: ${metadata.sgb}`,
    `  Cartridge Type: ${type(metadata.type)}`,
    `  ROM Size: ${metadata.romSize} bytes`,
    `  RAM Size: ${metadata.ramSize} bytes`,
    `  Destination: ${metadata.destination === 0 ? "Japan" : "Overseas"}`,
    `  Mask ROM Version: ${metadata.maskROMVersion}`,
  ].join("\n");
}

export { getMetadata, formatMetadata };
