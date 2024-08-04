// @ts-check

// TODO: this should not depend on Node
import assert from 'assert';

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
const ColorMode = {
  NoColor: 0,
  Compatible: 1,
  ColorOnly: 2,
  PGB: 3 // Not used
}

/**
 * @enum {number}
 */
const Destination = {
  Japan: 0,
  Overseas: 1
}

const RAM_BYTE_TO_SIZE = [
  0,
  0, // This should be unused
  8 * 1024,
  32 * 1024,
  128 * 1024,
  64 * 1024,
  // Not an error, it's in this order in the specs
]

const DESTINATION_BYTE_TO_DESTINATION = [Destination.Japan, Destination.Overseas]

/**
 * @param {Uint8Array} data 
 * @returns {import('./types').CartridgeMetadata}
 */
function getMetadata(data) {
  const view = new DataView(data.buffer);

  // TODO: these all need validation
  const entryPoint = data.slice(0x100, 0x104);
  const nintendoLogo = data.slice(0x0104, 0x0134);
  const title = data.slice(0x134, 0x143).toString();

  const cgb = data[0x143];
  const colorMode = cgb === 0x80
    ? ColorMode.Compatible
    : cgb === 0xC0 ? ColorMode.ColorOnly : ColorMode.NoColor;

  const newLicenseeCode = view.getUint16(0x0144, true);
  const sgb = data[0x0146] === 0x03;

  // TODO: map all the cartridge types
  const type = data[0x0147];
  // assert.ok(type === 0, `Unexpected ROM type; got 0x${type.toString(16)}, wanted 0`)

  assert.ok(data[0x0148] < 9, "Invalid ROM size.");
  const romSize = 32 * 1024 * (1 << data[0x0148]);

  const ramSize = RAM_BYTE_TO_SIZE[data[0x0149]] ?? 0;
  // TODO: this should be zero only if type does not have RAM. Cross check types once they are all mapped

  const destination = DESTINATION_BYTE_TO_DESTINATION[data[0x014A]];
  assert.ok(destination === 0 || destination === 1, `Invalid destination; expected 0x00 or 0x01, got 0x${data[0x014A].toString(16)}.`);

  const oldLicenseeCode = data[0x014B];
  const maskROMVersion = data[0x014C];

  // TODO: implement checksum validations
  const headerChecksum = data[0x014D];
  const globalChecksum = view.getUint16(0x014E, false)

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
    globalChecksum
  }
}

export { getMetadata }