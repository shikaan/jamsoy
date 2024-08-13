class Memory {
  #data = new Uint8Array(0x10000);
  #view = new DataView(this.#data.buffer);

  /**
   * @param {number} address - Uint16
   */
  readByte(address) {
    return this.#view.getUint8(address);
  }

  /**
   * @param {number} address - Uint16
   */
  readWord(address) {
    return this.#view.getUint16(address, true);
  }

  /**
   * @param {number} address - Uint16
   * @param {number} value - Uint8 
   */
  writeByte(address, value) {
    // Writing to ROM
    if (address < 0x8000) {
      throw new Error(`Cannot write to ROM at address ${address}`);
    }
    // Writing to the echo RAM
    else if (address >= 0xE000 && address < 0xFE00) {
      this.#view.setUint8(address, value);
      this.#view.setUint8(address - 0x2000, value);
    }
    else if (address >= 0xFEA0 && address < 0xFF00) {
      throw new Error(`Cannot write to restricted area at address ${address}`);
    } else {
      this.#view.setUint8(address, value);
    }
  }

  /**
   * @param {number} address - Uint16
   * @param {number} value - Uint16
   */
  writeWord(address, value) {
    if (address < 0x8000) {
      throw new Error(`Cannot write to ROM at address ${address}`);
    }
    else if (address >= 0xE000 && address < 0xFE00) {
      this.#view.setUint16(address, value, true);
      this.#view.setUint16(address - 0x2000, value, true);
    }
    else if (address >= 0xFEA0 && address < 0xFF00) {
      throw new Error(`Cannot write to restricted area at address ${address}`);
    } else {
      this.#view.setUint16(address, value, true);
    }
  }
}

export { Memory }
