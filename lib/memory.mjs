// @ts-check
import { Input, JOYP_ADDRESS } from "./input.mjs";

class Memory {
  #local = new Uint8Array(0x10000);
  #cartridge = new Uint8Array(0x200000);
  #serialCallback = (char) => { };

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

    if (address <= 0x7FFF) {
      // Cartridge ROM <= 0x7FFF
      result = this.#cartridge[address];
    } else if (address <= 0xDFFF) {
      // Video RAM <= 0x9FFF
      // Cartridge RAM <= 0xBFFF
      // Work RAM <= 0xDFFF
      result = this.#local[address];
    } else if (address <= 0xFDFF) {
      // Echo RAM
      result = this.#local[address - 0x2000];
    } else if (address <= 0xFE9F) {
      // OAM
      result = this.#local[address];
    } else if (address <= 0xFEFF) {
      // Not usable
      result = 0xff;
    } else if (address <= 0xFF7F) {
      // IO
      switch (address) {
        case JOYP_ADDRESS:
          // Joypad
          return this.#input.read();
        case 0xFF02:
          // Serial transfer
          this.#serialCallback?.(String.fromCharCode(this.readByte(0xFF01)));
          result = this.#local[address];
        case 0xFF0F:
        case 0xFF46:
          // Interrupts and DMA transfer
          result = this.#local[address];
        default:
          if (address >= 0xFF10 && address <= 0xFF3F) {
            // Sound
            return 0;
          } else if (address >= 0xFF04 && address <= 0xFF07) {
            // Timer
            result = this.#local[address];
          } else if ((address >= 0xFF40 && address <= 0xFF4B) || address === 0xFF4F || (address >= 0xFF51 && address <= 0xFF55) || (address >= 0xFF68 && address <= 0xFF6B)) {
            // Graphics
            result = this.#local[address];
          } else {
            // Unknown IO register
            result = this.#local[address];
          }
      }
    } else if (address <= 0xFFFF) {
      // High RAM <= 0xFFFE
      // Interrupt enable == 0xFFFF
      result = this.#local[address]
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
    if (address <= 0x7FFF) {
      // Cartridge ROM
      this.#cartridge[address] = data;
    } if (address <= 0xDFFF) {
      // Video RAM <= 0x9FFF
      // Cartridge RAM <= 0xBFFF
      // Work RAM <= 0xDFFF
      this.#local[address] = data;
    } else if (address <= 0xFDFF) {
      // Echo RAM
      this.#local[address - 0x2000] = data;
    } else if (address <= 0xFE9F) {
      // OAM
      this.#local[address] = data;
    } else if (address <= 0xFEFF) {
      // Not usable
      return;
    } else if (address <= 0xFF7F) {
      // IO
      if (address === JOYP_ADDRESS) {
        // Joypad
        this.#input.write(data);
      } else if (address >= 0xFF10 && address <= 0xFF3F) {
        // Sound
        return;
      } else if (address === 0xFF04) {
        // Divider
        this.#local[address] = 0;
      } else if (address >= 0xFF05 && address <= 0xFF07) {
        // Timer
        this.#local[address] = data;
      } else if (address === 0xFF0F) {
        // Interrupts
        this.#local[address] = data;
      } else if (address === 0xFF46) {
        this.#local[address] = data;
        this.DMATransfer(data);
      } else if ((address >= 0xFF40 && address <= 0xFF4B) || address === 0xFF4F || (address >= 0xFF51 && address <= 0xFF55) || (address >= 0xFF68 && address <= 0xFF6B)) {
        // Graphics
        this.#local[address] = data;
      } else if (address === 0xFF70) {
        // Work RAM bank
        this.#local[address] = data;
      } else {
        this.#local[address] = data;
      }
    } else if (address <= 0xFFFF) {
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
    const [low, high] = [value & 0xFF, value >> 8];
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
      throw new Error('ROM too large');
    }

    this.#cartridge.set(rom);
  }

  initialize() {
    this.#local = new Uint8Array(0x10000);
    this.#cartridge = new Uint8Array(0x200000);

    this.#local[0xFF05] = 0x00;
    this.#local[0xFF06] = 0x00;
    this.#local[0xFF07] = 0x00;
    this.#local[0xFF10] = 0x80;
    this.#local[0xFF11] = 0xBF;
    this.#local[0xFF12] = 0xF3;
    this.#local[0xFF14] = 0xBF;
    this.#local[0xFF16] = 0x3F;
    this.#local[0xFF17] = 0x00;
    this.#local[0xFF19] = 0xBF;
    this.#local[0xFF1A] = 0x7F;
    this.#local[0xFF1B] = 0xFF;
    this.#local[0xFF1C] = 0x9F;
    this.#local[0xFF1E] = 0xBF;
    this.#local[0xFF20] = 0xFF;
    this.#local[0xFF21] = 0x00;
    this.#local[0xFF22] = 0x00;
    this.#local[0xFF23] = 0xBF;
    this.#local[0xFF24] = 0x77;
    this.#local[0xFF25] = 0xF3;
    this.#local[0xFF26] = 0xF1;
    this.#local[0xFF40] = 0x91;
    this.#local[0xFF42] = 0x00;
    this.#local[0xFF43] = 0x00;
    this.#local[0xFF45] = 0x00;
    this.#local[0xFF47] = 0xFC;
    this.#local[0xFF48] = 0xFF;
    this.#local[0xFF49] = 0xFF;
    this.#local[0xFF4A] = 0x00;
    this.#local[0xFF4B] = 0x00;
    this.#local[0xFFFF] = 0x00;
  }

  DMATransfer(source) {
    const start = source * 0x100;
    for (let i = 0; i < 0xA0; i++) {
      this.writeByte(0xFE00 + i, this.readByte(start + i));
    }
  }
}

export { Memory }
