// @ts-check
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

/**
 * @enum {number}
 */
const ROMBanking = {
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
  ColorOnly: 2, // Not used
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

class CartridgeDecoder {
  #textDecoder = new TextDecoder("utf-8");

  /**
   * @param {Uint8Array} cartridge
   * @returns {import('../types').CartridgeMetadata}
   */
  decode(cartridge) {
    const view = new DataView(cartridge.buffer);

    // TODO: these all need validation
    const entryPoint = cartridge.slice(0x100, 0x104);
    const nintendoLogo = cartridge.slice(0x0104, 0x0134);
    const title = this.#textDecoder.decode(cartridge.slice(0x134, 0x143));

    const cgb = cartridge[0x143];
    const colorMode =
      cgb === 0x80
        ? ColorMode.Compatible
        : cgb === 0xc0
          ? ColorMode.ColorOnly
          : ColorMode.NoColor;

    const newLicenseeCode = view.getUint16(0x0144, true);
    const sgb = cartridge[0x0146] === 0x03;

    // TODO: map all the cartridge types
    let type;
    switch (cartridge[0x0147]) {
      case 0x00:
        type = ROMBanking.NoBanking;
        break;
      case 0x01:
      case 0x02:
      case 0x03:
        type = ROMBanking.MBC1;
        break;
      case 0x05:
      case 0x06:
        type = ROMBanking.MBC2;
        break;
      default:
        throw new Error(`Unsupported cartridge type: ${cartridge[0x0147]}`);
    }

    assert(cartridge[0x0148] < 9, "Invalid ROM size.");
    const romSize = 32 * 1024 * (1 << cartridge[0x0148]);

    const ramSize = RAM_BYTE_TO_SIZE[cartridge[0x0149]] ?? 0;

    const destination = DESTINATION_BYTE_TO_DESTINATION[cartridge[0x014a]];
    assert(
      destination === 0 || destination === 1,
      `Invalid destination; expected 0x00 or 0x01, got 0x${cartridge[0x014a].toString(16)}.`,
    );

    const oldLicenseeCode = cartridge[0x014b];
    const maskROMVersion = cartridge[0x014c];

    // TODO: implement checksum validations
    const headerChecksum = cartridge[0x014d];
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
}

export { CartridgeDecoder, ColorMode, Destination, ROMBanking };
