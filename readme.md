<h1 align="center">JamSoy</h1>

<p align="center">
GameBoy emulator in pure JavaScript.
</p>

<p align="center">
  <img width="160" height="144" src="https://github.com/user-attachments/assets/83d67d14-c91d-4903-96cf-0bd412a37857" alt="The Legend of Zelda - Link's Awakening Opening Screen">
  <img width="160" height="144" src="https://github.com/user-attachments/assets/38a08c1a-0085-4548-ab64-6b8a50368a5a" alt="Dr. Mario Opening Screen">
  <img width="160" height="144" src="https://github.com/user-attachments/assets/612f0367-ab3b-4c48-aff8-c2a3174ca2ea" alt="Tetris Opening Screen">
</p>

> [!CAUTION]
> This is not stable! I made this to learn emulation and it's my first attempt at it. I did not dig too deep in many areas, so a few things might be plain wrong.

## Features

* Supports GameBoy ROMs (no gbc, sgb, gba)
* Supports No MBC and MBC1 ROMs
* You can try it out [here](https://shikaan.github.io/jamsoy/)
* Passes most Blarrg's tests
* Does not depend on Browser APIs.
  * It runs in Node (tested) and probably other runtimes (Deno, Bun)

## Deployment

The web version is deployed on GitHub pages. You can deploy a new version like this:

```sh
git checkout docs
git merge origin/main
npm run bundle
git add .
git commit -m "chore: release"
git push
```

## Development

The project is Vanilla JavaScript and has no dependencies.

The entry point is the `GameBoy` class, which instantiates and wires up all the
other components. The structure loosely maps hardware components.

* `cpu`: execute instructions and return the correct cycle times
* `decoder`: inspect the ROM and the opcodes, used for debugging
* `gfx`: display pixels with right timing, it abstract screen to not depend on browser
* `gameboy`: orchestrator class
* `input`: abstracts sending input to the emulator, to be used by browsers or other drivers (see `public/index.html` for an example)
* `interrupts`: handles all the interrupts for the emulator
* `memory`: the bus thorugh which all the read/write operation are routed
* `timer`: synchronizes actions and issues timer interrupts 
