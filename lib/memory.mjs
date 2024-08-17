// @ts-check

// TODO: support memory banking

class Memory {
  #data = new Uint8Array(0x10000);
  #view = new DataView(this.#data.buffer);
  #writeCallbacks = new Map();

  /**
   * @param {number} address - Uint16
   */
  readByte(address, signed = false) {
    return signed ? this.#view.getInt8(address) : this.#view.getUint8(address);
  }

  /**
   * @param {number} address - Uint16
   */
  readWord(address, signed = false) {
    return signed ? this.#view.getInt16(address, true) : this.#view.getUint16(address, true);
  }

  /**
   * @param {number} address - Uint16
   * @param {number} value - Uint8 
   */
  writeByte(address, value) {
    const oldValue = this.#view.getUint8(address);
    // Writing to ROM
    if (address < 0x8000) {
      // throw new Error(`Cannot write to ROM at address ${address}`);
    }
    // Writing to the echo RAM
    else if (address >= 0xE000 && address < 0xFE00) {
      this.#view.setUint8(address, value);
      this.#view.setUint8(address - 0x2000, value);
    }
    else if (address >= 0xFEA0 && address < 0xFF00) {
      throw new Error(`Cannot write to restricted area at address ${address}`);
    } else if (address === 0xFF44) {
      this.#view.setUint8(address, 0);
    } else if (address === 0xFF46) {
      this.DMATransfer(value);
    } else {
      this.#view.setUint8(address, value);
    }

    this.#writeCallbacks.get(address)?.(value, oldValue);
  }

  /**
   * @param {number} address - Uint16
   * @param {number} value - Uint16
   */
  writeWord(address, value) {
    const oldValue = this.#view.getUint16(address);
    if (address < 0x8000) {
      throw new Error(`Cannot write to ROM at address ${address}`);
    }
    else if (address >= 0xE000 && address < 0xFE00) {
      this.#view.setUint16(address, value, true);
      this.#view.setUint16(address - 0x2000, value, true);
    }
    else if (address >= 0xFEA0 && address < 0xFF00) {
      throw new Error(`Cannot write to restricted area at address ${address}`);
    } else if (address === 0xFF44) {
      this.#view.setUint16(address, 0);
    } else if (address === 0xFF46) {
      this.DMATransfer(value);
    } else {
      this.#view.setUint16(address, value, true);
    }

    this.#writeCallbacks.get(address)?.(value, oldValue);
  }

  /**
   * @param {number} address - Uint16
   * @param {number} value - Uint8
  */
  unsafeWriteByte(address, value) {
    const oldValue = this.#view.getUint8(address);
    this.#view.setUint8(address, value);
    this.#writeCallbacks.get(address)?.(value, oldValue);
  }

  /**
   * @param {Uint8Array} rom
   */
  loadROM(rom) {
    if (rom.length > 0x8000) {
      throw new Error('ROM too large');
    }

    this.#data.set(rom, 0);
  }

  /**
   * @returns {Uint8Array}
   */
  getROM() {
    return this.#data.slice(0, 0x8000);
  }

  initialize() {
    this.#view.setUint8(0xFF05, 0x00);
    this.#view.setUint8(0xFF06, 0x00);
    this.#view.setUint8(0xFF07, 0x00);
    this.#view.setUint8(0xFF10, 0x80);
    this.#view.setUint8(0xFF11, 0xBF);
    this.#view.setUint8(0xFF12, 0xF3);
    this.#view.setUint8(0xFF14, 0xBF);
    this.#view.setUint8(0xFF16, 0x3F);
    this.#view.setUint8(0xFF17, 0x00);
    this.#view.setUint8(0xFF19, 0xBF);
    this.#view.setUint8(0xFF1A, 0x7F);
    this.#view.setUint8(0xFF1B, 0xFF);
    this.#view.setUint8(0xFF1C, 0x9F);
    this.#view.setUint8(0xFF1E, 0xBF);
    this.#view.setUint8(0xFF20, 0xFF);
    this.#view.setUint8(0xFF21, 0x00);
    this.#view.setUint8(0xFF22, 0x00);
    this.#view.setUint8(0xFF23, 0xBF);
    this.#view.setUint8(0xFF24, 0x77);
    this.#view.setUint8(0xFF25, 0xF3);
    this.#view.setUint8(0xFF26, 0xF1);
    this.#view.setUint8(0xFF40, 0x91);
    this.#view.setUint8(0xFF42, 0x00);
    this.#view.setUint8(0xFF43, 0x00);
    this.#view.setUint8(0xFF45, 0x00);
    this.#view.setUint8(0xFF47, 0xFC);
    this.#view.setUint8(0xFF48, 0xFF);
    this.#view.setUint8(0xFF49, 0xFF);
    this.#view.setUint8(0xFF4A, 0x00);
    this.#view.setUint8(0xFF4B, 0x00);
    this.#view.setUint8(0xFFFF, 0x00);
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
