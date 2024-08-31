// @ts-check
import { Input, JOYP_ADDRESS } from "./input.mjs";

class Memory {
  #local = new Uint8Array(0x10000);

  #ram = new Uint8Array(0x8000);
  #currentRAMBank = 0;

  #rom = new Uint8Array(0x200000);
  #currentROMBank = 1;

  // TODO: we are only supporting MBC1 for now
  #isBanking = false;
  // Games need to explicitly enable RAM to use it
  #enableRAM = false;
  // While banking, are we ROM banking or RAM banking?
  #isROMBanking = false;

  #serialCallback = (char) => {};

  #input;

  /**
   * @param {Input} input
   */
  constructor(input) {
    this.#input = input;
  }

  /**
   * @param {number} address - Uint16
   * @returns {number} - Uint8
   */
  readByte(address, signed = false) {
    let result = 0;

    if (address <= 0x3fff) {
      // Cartridge ROM <= 0x3FFF
      result = this.#rom[address];
    } else if (address <= 0x7fff) {
      // Switchable ROM <= 0x7FFF
      result = this.#rom[address - 0x4000 + this.#currentROMBank * 0x4000];
    } else if (address <= 0x9fff) {
      // Video RAM <= 0x9FFF
      result = this.#local[address];
    } else if (address <= 0xbfff) {
      // Cartridge RAM <= 0xBFFF
      result = this.#ram[address - 0xa000 + this.#currentRAMBank * 0x2000];
    } else if (address <= 0xdfff) {
      // Work RAM <= 0xDFFF
      result = this.#local[address];
    } else if (address <= 0xfdff) {
      // Echo RAM
      result = this.#local[address - 0x2000];
    } else if (address <= 0xfe9f) {
      // OAM
      result = this.#local[address];
    } else if (address <= 0xfeff) {
      // Not usable
      result = 0xff;
    } else if (address <= 0xff7f) {
      // IO
      switch (address) {
        case JOYP_ADDRESS:
          // Joypad
          return this.#input.read();
        case 0xff02:
          // Serial transfer
          this.#serialCallback?.(String.fromCharCode(this.readByte(0xff01)));
          result = this.#local[address];
        case 0xff0f:
        case 0xff46:
          // Interrupts and DMA transfer
          result = this.#local[address];
        default:
          if (address >= 0xff10 && address <= 0xff3f) {
            // Sound
            return 0;
          } else if (address >= 0xff04 && address <= 0xff07) {
            // Timer
            result = this.#local[address];
          } else if (
            (address >= 0xff40 && address <= 0xff4b) ||
            address === 0xff4f ||
            (address >= 0xff51 && address <= 0xff55) ||
            (address >= 0xff68 && address <= 0xff6b)
          ) {
            // Graphics
            result = this.#local[address];
          } else {
            // Unknown IO register
            result = this.#local[address];
          }
      }
    } else if (address <= 0xffff) {
      // High RAM <= 0xFFFE
      // Interrupt enable == 0xFFFF
      result = this.#local[address];
    }

    return signed ? (result & 0x80 ? result - 0x100 : result) : result;
  }

  onSerial(callback) {
    this.#serialCallback = callback;
  }

  /**
   * @param {number} address - Uint16
   */
  readWord(address) {
    const [low, high] = [this.readByte(address), this.readByte(address + 1)];
    return (high << 8) + low;
  }

  /**
   * @param {number} address - Uint16
   * @param {number} data - Uint8
   */
  writeByte(address, data) {
    if (address <= 0x7fff) {
      // Cartridge ROM
      if (!this.#isBanking) return;

      return this.#handleBanking(address, data);
    } else if (address <= 0x9fff) {
      // Video RAM <= 0x9FFF
      this.#local[address] = data;
    } else if (address <= 0xbfff) {
      // Cartridge RAM <= 0xBFFF
      if (!this.#enableRAM) return;
      this.#ram[address - 0xa000 + this.#currentRAMBank * 0x2000] = data;
    } else if (address <= 0xdfff) {
      // Work RAM <= 0xDFFF
      this.#local[address] = data;
    } else if (address <= 0xfdff) {
      // Echo RAM
      this.#local[address - 0x2000] = data;
    } else if (address <= 0xfe9f) {
      // OAM
      this.#local[address] = data;
    } else if (address <= 0xfeff) {
      // Not usable
      return;
    } else if (address <= 0xff7f) {
      // IO
      if (address === JOYP_ADDRESS) {
        // Joypad
        this.#input.write(data);
      } else if (address >= 0xff10 && address <= 0xff3f) {
        // Sound
        return;
      } else if (address === 0xff04) {
        // Divider
        this.#local[address] = 0;
      } else if (address >= 0xff05 && address <= 0xff07) {
        // Timer
        this.#local[address] = data;
      } else if (address === 0xff0f) {
        // Interrupts
        this.#local[address] = data;
      } else if (address === 0xff46) {
        this.#local[address] = data;
        this.#DMATransfer(data);
      } else if (
        (address >= 0xff40 && address <= 0xff4b) ||
        address === 0xff4f ||
        (address >= 0xff51 && address <= 0xff55) ||
        (address >= 0xff68 && address <= 0xff6b)
      ) {
        // Graphics
        this.#local[address] = data;
      } else if (address === 0xff70) {
        // Work RAM bank
        this.#local[address] = data;
      } else {
        this.#local[address] = data;
      }
    } else if (address <= 0xffff) {
      // High RAM <= 0xFFFE
      // Interrupt enable == 0xFFFF
      this.#local[address] = data;
    }
  }

  /**
   * @param {number} address - Uint16
   * @param {number} value - Uint16
   */
  writeWord(address, value) {
    const [low, high] = [value & 0xff, value >> 8];
    this.writeByte(address, low);
    this.writeByte(address + 1, high);
  }

  /**
   * Write byte skipping the traps and callbacks
   * @param {number} address - Uint16
   * @param {number} value - Uint8
   */
  unsafeWriteByte(address, value) {
    this.#local[address] = value;
  }

  /**
   * Read byte skipping the traps and callbacks
   * @param {number} address - Uint16
   * @returns {number} - Uint8
   */
  unsafeReadByte(address) {
    return this.#local[address];
  }

  /**
   * @param {Uint8Array} rom
   */
  loadROM(rom) {
    if (rom.length >= 0x200000) {
      throw new Error("ROM too large");
    }

    this.#rom.set(rom);
    this.#isBanking = rom[0x147] !== 0;
  }

  initialize() {
    this.#local = new Uint8Array(0x10000);

    this.#ram = new Uint8Array(0x8000);
    this.#currentRAMBank = 0;

    this.#rom = new Uint8Array(0x200000);
    this.#currentROMBank = 1;

    this.#isROMBanking = false;
    this.#isBanking = false;
    this.#enableRAM = false;

    this.#local[0xff05] = 0x00;
    this.#local[0xff06] = 0x00;
    this.#local[0xff07] = 0x00;
    this.#local[0xff10] = 0x80;
    this.#local[0xff11] = 0xbf;
    this.#local[0xff12] = 0xf3;
    this.#local[0xff14] = 0xbf;
    this.#local[0xff16] = 0x3f;
    this.#local[0xff17] = 0x00;
    this.#local[0xff19] = 0xbf;
    this.#local[0xff1a] = 0x7f;
    this.#local[0xff1b] = 0xff;
    this.#local[0xff1c] = 0x9f;
    this.#local[0xff1e] = 0xbf;
    this.#local[0xff20] = 0xff;
    this.#local[0xff21] = 0x00;
    this.#local[0xff22] = 0x00;
    this.#local[0xff23] = 0xbf;
    this.#local[0xff24] = 0x77;
    this.#local[0xff25] = 0xf3;
    this.#local[0xff26] = 0xf1;
    this.#local[0xff40] = 0x91;
    this.#local[0xff42] = 0x00;
    this.#local[0xff43] = 0x00;
    this.#local[0xff45] = 0x00;
    this.#local[0xff47] = 0xfc;
    this.#local[0xff48] = 0xff;
    this.#local[0xff49] = 0xff;
    this.#local[0xff4a] = 0x00;
    this.#local[0xff4b] = 0x00;
    this.#local[0xffff] = 0x00;
  }
  #DMATransfer(source) {
    const start = source * 0x100;
    for (let i = 0; i < 0xa0; i++) {
      this.writeByte(0xfe00 + i, this.#local[start + i]);
    }
  }

  #handleBanking(address, data) {
    if (address <= 0x1fff) {
      // Games request to enable ram by writing 0x0A here
      this.#enableRAM = (data & 0x0a) === 0x0a;
    } else if (address <= 0x3fff) {
      // Change Low ROM Bank
      // Only override the lower 5 bits
      const newValue = (this.#currentROMBank & 0xe0) | (data & 0x1f);
      this.#currentROMBank = newValue === 0 ? 1 : newValue;
    } else if (address <= 0x5fff) {
      if (this.#isROMBanking) {
        // Change High ROM Bank
        // Only override the upper 3 bits
        const newValue = (this.#currentROMBank & 0x1f) | (data & 0xe0);
        this.#currentROMBank = newValue === 0 ? 1 : newValue;
      } else {
        // Change RAM Bank
        this.#currentRAMBank = data & 0x03;
      }
    } else if (address <= 0x7fff) {
      // ROM/RAM Mode
      this.#isROMBanking = (data & 0x01) === 0;
      this.#currentRAMBank = this.#isROMBanking ? 0 : this.#currentRAMBank;
    }
  }
}

export { Memory };
