#! /usr/bin/env node
//@ts-check
import { setTimeout } from 'node:timers/promises';
import { readFile } from 'node:fs/promises'

import sdl from '@kmamal/sdl'

import { Screen } from '../lib/gfx/screen.mjs';
import { GameBoy } from '../lib/gameboy.mjs';
import { Input, KEY } from '../lib/input.mjs';
import { CartridgeDecoder } from '../lib/decoder/cartridge.mjs';
import { basename } from 'node:path';

class SDLScreen extends Screen {
  constructor() {
    super();
    this.window = sdl.video.createWindow({ title: 'JamSoy', width: 320, height: 288 });
    this.buffer = Buffer.alloc(160 * 144 * 4);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {Uint8ClampedArray} color
   */
  setPixel(x, y, color) {
    const index = (x + y * 160) * 4;
    this.buffer[index] = color[0];
    this.buffer[index + 1] = color[1];
    this.buffer[index + 2] = color[2];
    this.buffer[index + 3] = 255;
  }

  render() {
    const buffer = Buffer.from(this.buffer.buffer);
    this.window.render(160, 144, 160 * 4, 'rgba32', buffer);
  }

  clear() {
    this.buffer.fill(0);
    this.render();
  }

  getWindow() {
    return this.window;
  }
}

(async function main() {
  const filePath = process.argv[2];


  if (!filePath) {
    console.error(`Usage: ${basename(process.argv[1])} <ROM path>`);
    process.exit(1);
  }

  const input = new Input();
  const screen = new SDLScreen();
  const gameboy = new GameBoy(screen, input);
  const cartridgeDecoder = new CartridgeDecoder();
  const window = screen.getWindow();

  const rom = await readFile(process.argv[2]);
  gameboy.loadROM(rom);

  const meta = cartridgeDecoder.decode(rom);

  const keyMap = {
    up: KEY.UP,
    down: KEY.DOWN,
    left: KEY.LEFT,
    right: KEY.RIGHT,
    z: KEY.A,
    x: KEY.B,
    return: KEY.START,
    shift: KEY.SELECT,
  };

  window.on('keyDown', ({ key }) => input.keyDown(keyMap[key]));
  window.on('keyUp', ({ key }) => input.keyUp(keyMap[key]));
  window.setTitle(`JamSoy - ${meta.title}`);

  while (!window.destroyed) {
    gameboy.update();
    screen.render();

    await setTimeout(0);
  }

})().catch((err) => {
  console.error(err);
  process.exit(1);
})