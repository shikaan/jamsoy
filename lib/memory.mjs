// @ts-check

import { format } from "./format.mjs";

const within = (value, min, max) => value >= min && value <= max;

class Memory {
  #local = new DataView((new Uint8Array(0x10000)).buffer);
  #cartridge = new DataView((new Uint8Array(0x200000)).buffer);
  #writeCallbacks = new Map();
  #serialCallback;

  /**
   * @param {number} address - Uint16
   * @returns {number} - Uint8
   */
  readByte(address, signed = false) {
    const fn = signed ? 'getInt8' : 'getUint8';

    if (within(address, 0, 0x7FFF)) {
      // Cartridge ROM
      return this.#cartridge[fn](address);
    } else if (within(address, 0x8000, 0x9FFF)) {
      // Video RAM
      return this.#local[fn](address);
    } else if (within(address, 0xA000, 0xBFFF)) {
      // Cartridge RAM
      return this.#cartridge[fn](address);
    } else if (within(address, 0xC000, 0xDFFF)) {
      // Work RAM
      return this.#local[fn](address);
    } else if (within(address, 0xE000, 0xFDFF)) {
      // Echo RAM
      return this.readByte(address - 0x2000);
    }
    else if (within(address, 0xFE00, 0xFE9F)) {
      // OAM
      return this.#local[fn](address);
    } else if (within(address, 0xFEA0, 0xFEFF)) {
      // Not usable
      console.warn('Not usable memory');
      return this.#local[fn](address);
    } else if (within(address, 0xFF00, 0xFF7F)) {

      if (address === 0xFF44) {
        // LY hack for test
        return 0x90;
      }

      // IO
      if (address === 0xFF00) {
        // Joypad
        // console.warn('Joypad not implemented');
        return 0;
      } else if (within(address, 0xFF10, 0xFF3F)) {
        // Sound
        // console.warn('Sound not implemented');
        return 0;
      } else if (within(address, 0xFF04, 0xFF07)) {
        // Timer
        return this.#local[fn](address);
      } else if (address === 0xFF0F) {
        // Interrupts
        return this.#local[fn](address);
      } else if (address === 0xFF02) {
        // Serial transfer
        this.#serialCallback?.(String.fromCharCode(this.readByte(0xFF01)));
        return this.#local[fn](address);
      } else if (within(address, 0xFF40, 0xFF4B) || address === 0xFF4F || within(address, 0xFF51, 0xFF55) || within(address, 0xFF68, 0xFF6B)) {
        // Graphics
        return this.#local[fn](address);
      }
      // TODO: this is CGB only
      else if (false && address === 0xFF70) {
        // Work RAM bank
        return this.#local[fn](address);
      } else if (within(address, 0xFF80, 0xFFFE)) {
        // High RAM
        return this.#local[fn](address);
      } else if (address === 0xFFFF) {
        // Interrupt enable
        return this.#local[fn](address);
      }
      else {
        // console.warn(`Unknown IO register ${address.toString(16)}`);
        return this.#local[fn](address);
      }
    }
    else if (within(address, 0xFF80, 0xFFFE)) {
      // High RAM
      return this.#local[fn](address);
    } else if (address === 0xFFFF) {
      // Interrupt enable
      return this.#local[fn](address);
    }

    console.warn(`Unknown memory address ${format.hex(address)}`);
    return 0;
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
    const old = this.readByte(address);
    if (within(address, 0, 0x7FFF)) {
      // Cartridge ROM 
      // TODO: should this even be allowed?
      // TODO: split in two and handle banking
      this.#cartridge.setUint8(address, data);
    } else if (within(address, 0x8000, 0x9FFF)) {
      // Video RAM
      this.#local.setUint8(address, data);
    } else if (within(address, 0xA000, 0xBFFF)) {
      // Cartridge RAM
      this.#cartridge.setUint8(address, data);
    } else if (within(address, 0xC000, 0xDFFF)) {
      // Work RAM
      // TODO: handle CGB mode
      this.#local.setUint8(address, data);
    } else if (within(address, 0xE000, 0xFDFF)) {
      // Echo RAM
      this.writeByte(address - 0x2000, data);
    } else if (within(address, 0xFE00, 0xFE9F)) {
      // OAM
      this.#local.setUint8(address, data);
    } else if (within(address, 0xFEA0, 0xFEFF)) {
      // Not usable
      console.warn('Not usable memory');
      this.#local.setUint8(address, data);
    } else if (within(address, 0xFF00, 0xFF7F)) {
      // IO
      if (address === 0xFF00) {
        // Joypad
        // console.warn('Joypad not implemented');
      } else if (within(address, 0xFF10, 0xFF3F)) {
        // Sound
        // console.warn('Sound not implemented');
      } else if (within(address, 0xFF04, 0xFF07)) {
        // Timer
        this.#local.setUint8(address, data);
      } else if (address === 0xFF0F) {
        // Interrupts
        this.#local.setUint8(address, data);
      } else if (address === 0xFF46) {
        this.DMATransfer(data);
      } else if (within(address, 0xFF40, 0xFF4B) || address === 0xFF4F || within(address, 0xFF51, 0xFF55) || within(address, 0xFF68, 0xFF6B)) {
        // Graphics
        this.#local.setUint8(address, data);
      } else if (address === 0xFF70) {
        // Work RAM bank
        this.#local.setUint8(address, data);
      } else {
        // console.warn(`Unknown IO register ${address.toString(16)}`);
        this.#local.setUint8(address, data);
      }
    } else if (within(address, 0xFF80, 0xFFFE)) {
      // High RAM
      this.#local.setUint8(address, data);
    } else if (address === 0xFFFF) {
      // Interrupt enable
      this.#local.setUint8(address, data);
    }

    this.#writeCallbacks.get(address)?.(data, old);
  }

  /**
   * @param {number} address - Uint16
   * @param {number} value - Uint16
   */
  writeWord(address, value) {
    const old = this.readWord(address);
    const [low, high] = [value & 0xFF, value >> 8];
    this.writeByte(address, low);
    this.writeByte(address + 1, high);
    this.#writeCallbacks.get(address)?.(value, old);
  }

  /**
   * @param {number} address - Uint16
   * @param {number} value - Uint8
  */
  unsafeWriteROMByte(address, value) {
    const old = this.#local.getUint8(address);
    this.#local.setUint8(address, value);
    this.#writeCallbacks.get(address)?.(value, old);
  }

  unsafeReadROMByte(address) {
    return this.#local.getUint8(address);
  }

  /**
   * @param {Uint8Array} rom
   */
  loadROM(rom) {
    if (rom.length >= 0x200000) {
      throw new Error('ROM too large');
    }

    for (let i = 0; i < rom.length; i++) {
      this.#cartridge.setUint8(i, rom[i]);
    }
  }

  initialize() {
    this.#local.setUint8(0xFF05, 0x00);
    this.#local.setUint8(0xFF06, 0x00);
    this.#local.setUint8(0xFF07, 0x00);
    this.#local.setUint8(0xFF10, 0x80);
    this.#local.setUint8(0xFF11, 0xBF);
    this.#local.setUint8(0xFF12, 0xF3);
    this.#local.setUint8(0xFF14, 0xBF);
    this.#local.setUint8(0xFF16, 0x3F);
    this.#local.setUint8(0xFF17, 0x00);
    this.#local.setUint8(0xFF19, 0xBF);
    this.#local.setUint8(0xFF1A, 0x7F);
    this.#local.setUint8(0xFF1B, 0xFF);
    this.#local.setUint8(0xFF1C, 0x9F);
    this.#local.setUint8(0xFF1E, 0xBF);
    this.#local.setUint8(0xFF20, 0xFF);
    this.#local.setUint8(0xFF21, 0x00);
    this.#local.setUint8(0xFF22, 0x00);
    this.#local.setUint8(0xFF23, 0xBF);
    this.#local.setUint8(0xFF24, 0x77);
    this.#local.setUint8(0xFF25, 0xF3);
    this.#local.setUint8(0xFF26, 0xF1);
    this.#local.setUint8(0xFF40, 0x91);
    this.#local.setUint8(0xFF42, 0x00);
    this.#local.setUint8(0xFF43, 0x00);
    this.#local.setUint8(0xFF45, 0x00);
    this.#local.setUint8(0xFF47, 0xFC);
    this.#local.setUint8(0xFF48, 0xFF);
    this.#local.setUint8(0xFF49, 0xFF);
    this.#local.setUint8(0xFF4A, 0x00);
    this.#local.setUint8(0xFF4B, 0x00);
    this.#local.setUint8(0xFFFF, 0x00);
  }

  onWrite(address, callback) {
    this.#writeCallbacks.set(address, callback);
  }

  DMATransfer(source) {
    source <<= 8; // source * 100
    for (let i = 0; i < 0xA0; i++) {
      this.writeByte(0xFE00 + i, this.readByte(source + i));
    }
  }
}

export { Memory }
