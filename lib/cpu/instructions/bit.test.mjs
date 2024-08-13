import { describe, it, beforeEach } from "node:test";
import { bit, res, set } from "./bit.mjs";
import { makeData, makeEmptyRegister } from "../../test/utils.mjs";
import assert from "node:assert";

describe("bit", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("sets zero flag when bit is zero", () => {
    register.A = 0b10101010;
    const instruction = {
      operands: [
        { name: "0", immediate: true },
        { name: "A", immediate: true },
      ],
      cycles: [1],
    };
    const result = bit(instruction, register, data);

    assert.strictEqual(register.flagZero, true);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, true);
    assert.strictEqual(result, 1);
  });

  it("clears zero flag when bit is one", () => {
    register.A = 0b10101010;
    const instruction = {
      operands: [{ name: "1", immediate: true }, { name: "A" }],
      cycles: [1],
    };
    const result = bit(instruction, register, data);

    assert.strictEqual(register.flagZero, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, true);
    assert.strictEqual(result, 1);
  });

  it("returns the correct cycle count", () => {
    register.A = 0b10101010;
    const instruction = {
      operands: [
        { name: "7", immediate: true },
        { name: "A", immediate: true },
      ],
      cycles: [2],
    };
    const result = bit(instruction, register, data);

    assert.strictEqual(result, 2);
  });
});

describe("set", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("sets the bit in the register", () => {
    register.A = 0b10101010;
    const instruction = {
      operands: [
        { name: "0", immediate: true },
        { name: "A", immediate: true },
      ],
      cycles: [1],
    };
    const result = set(instruction, register, data);

    assert.strictEqual(register.A, 0b10101011);
    assert.strictEqual(result, 1);
  });

  it("returns the correct cycle count", () => {
    register.A = 0b10101010;
    const instruction = {
      operands: [{ name: "7", immediate: true }, { name: "A" }],
      cycles: [2],
    };
    const result = set(instruction, register, data);

    assert.strictEqual(result, 2);
  });
});

describe("res", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("resets the bit in the register", () => {
    register.A = 0b10101010;
    const instruction = {
      operands: [
        { name: "0", immediate: true },
        { name: "A", immediate: true },
      ],
      cycles: [1],
    };
    const result = res(instruction, register, data);

    assert.strictEqual(register.A, 0b10101010);
    assert.strictEqual(result, 1);
  });

  it("returns the correct cycle count", () => {
    register.A = 0b10101010;
    const instruction = {
      operands: [
        { name: "7", immediate: true },
        { name: "A", immediate: true },
      ],
      cycles: [2],
    };
    const result = res(instruction, register, data);

    assert.strictEqual(result, 2);
  });
});
