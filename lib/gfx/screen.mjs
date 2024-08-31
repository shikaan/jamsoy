// @ts-check

class Screen {
  setPixel(x, y, uint32) {
    throw new Error("Not implemented");
  }

  draw() {
    throw new Error("Not implemented");
  }

  clear() {
    throw new Error("Not implemented");
  }
}

class CanvasScreen extends Screen {
  #context;
  #imageData = new ImageData(160, 144);

  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    super();
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get 2d context from canvas");
    }

    this.#context = context;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {Uint8ClampedArray} color
   */
  setPixel(x, y, color) {
    this.#imageData.data.set(color, (x + y * 160) * 4);
  }

  draw() {
    this.#context.putImageData(this.#imageData, 0, 0);
  }

  clear() {
    this.#imageData = new ImageData(160, 144);
    this.draw();
  }
}

export { CanvasScreen, Screen };
