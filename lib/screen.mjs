// @ts-check

class Screen {
  setPixel(x, y, r, g, b) {
    throw new Error('Not implemented');
  }

  draw() {
    throw new Error('Not implemented');
  }

  clear() {
    throw new Error('Not implemented');
  }
}

class CanvasScreen extends Screen {
  #canvas;
  #context;
  #buffer = new Uint32Array(160 * 144);

  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    super();
    this.#canvas = canvas;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get 2d context from canvas');
    }

    this.#context = context;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} r
   * @param {number} g
   * @param {number} b
   */
  setPixel(x, y, r, g, b) {
    this.#buffer[x + y * this.#canvas.width] = (255 << 24) | (b << 16) | (g << 8) | r;
  }

  draw() {
    const imageData = this.#context.createImageData(160, 144);
    const data = imageData.data;

    for (let i = 0; i < this.#buffer.length; i++) {
      const color = this.#buffer[i];
      const r = color & 0xff;
      const g = (color >> 8) & 0xff;
      const b = (color >> 16) & 0xff;
      const j = i * 4;
      data[j] = r;
      data[j + 1] = g;
      data[j + 2] = b;
      data[j + 3] = 255;
    }

    this.#context.putImageData(imageData, 0, 0);
  }

  clear() {
    this.#buffer = new Uint32Array(160 * 144);
    this.draw();
  }
}

export { CanvasScreen, Screen };