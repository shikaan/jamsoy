JamSoy
---

GameBoy emulator in pure JavaScript

> [!CAUTION]
> This is not stable! I made this to learn about emulation and it's my first attempt at it. I did not dig too deep in many areas, so a few things might be plain wrong.

## Features

* Supports GameBoy ROMs (no gbc, sgb, gba)
* Supports No Banking and MBC1 ROMs
* Most games run fine, but occasionally you'll hit a glitch (see timing note below)
* You can try it out [here](https://shikaan.github.io/jamsoy/)
* Passes most Blarrg's tests
* Does not depend on Browser APIs.
  * It runs in Node (tested) and probably other runtimes (Deno, Bun)

## TO-DOs

* Does not support sound
* Timing is not precise. Specifically, PPU penalties are wrong I believe
* Does not support save states
* Palette is hardcoded, but doesn't have to be
* There is no ROM validation

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