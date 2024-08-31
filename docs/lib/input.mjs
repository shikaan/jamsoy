const JOYP_ADDRESS = 0xff00;

const KEY = {
  RIGHT: 0,
  LEFT: 1,
  UP: 2,
  DOWN: 3,
  A: 4,
  B: 5,
  SELECT: 6,
  START: 7,
};

class Input {
  #column = 0;
  #rows = [0x0f, 0x0f];

  initialize() {
    this.#column = 0;
    this.#rows = [0x0f, 0x0f];
  }

  read() {
    switch (this.#column) {
      case 0x10:
        return this.#rows[1];
      case 0x20:
        return this.#rows[0];
      default:
        return 0xff;
    }
  }

  write(value) {
    this.#column = value & 0x30;
  }

  keyDown(key) {
    switch (key) {
      case KEY.RIGHT:
        this.#rows[0] &= 0xe;
        break;
      case KEY.LEFT:
        this.#rows[0] &= 0xd;
        break;
      case KEY.UP:
        this.#rows[0] &= 0xb;
        break;
      case KEY.DOWN:
        this.#rows[0] &= 0x7;
        break;
      case KEY.A:
        this.#rows[1] &= 0xe;
        break;
      case KEY.B:
        this.#rows[1] &= 0xd;
        break;
      case KEY.SELECT:
        this.#rows[1] &= 0xb;
        break;
      case KEY.START:
        this.#rows[1] &= 0x7;
        break;
    }
  }

  keyUp(key) {
    switch (key) {
      case KEY.RIGHT:
        this.#rows[0] |= 0x1;
        break;
      case KEY.LEFT:
        this.#rows[0] |= 0x2;
        break;
      case KEY.UP:
        this.#rows[0] |= 0x4;
        break;
      case KEY.DOWN:
        this.#rows[0] |= 0x8;
        break;
      case KEY.A:
        this.#rows[1] |= 0x1;
        break;
      case KEY.B:
        this.#rows[1] |= 0x2;
        break;
      case KEY.SELECT:
        this.#rows[1] |= 0x4;
        break;
      case KEY.START:
        this.#rows[1] |= 0x8;
        break;
    }
  }
}

export { Input, JOYP_ADDRESS, KEY };
