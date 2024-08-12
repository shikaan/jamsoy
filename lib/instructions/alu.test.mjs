// @ts-check
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { add, and, dec, inc, sub, or, xor, cp } from "./alu.mjs";
import { makeData, makeEmptyRegister } from "../../test/utils.mjs";
import { INVALID_INSTRUCTION_RETURN } from "./_utils.mjs";

describe("add", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  describe("with 8-bit registers", () => {
    it("sums correctly", () => {
      register.B = 0x01;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "A" }, { name: "B" }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.A, 0x01);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    });

    it("handles zero flag", () => {
      register.B = 0;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "A" }, { name: "B" }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.A, 0x00, "result is incorrect");
      assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        false,
        "flagHalfCarry is incorrect",
      );
    });

    it("handles carry flag", () => {
      register.A = 0x10;
      register.B = 0xfe;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "A" }, { name: "B" }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.A, 0x0e);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        false,
        "flagHalfCarry is incorrect",
      );
    });

    it("handles half carry flag", () => {
      register.A = 1;
      register.B = 0xf;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "A" }, { name: "B" }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.A, 0x10);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        true,
        "flagHalfCarry is incorrect",
      );
    });
  });

  describe("with 16-bit registers", () => {
    it("sums correctly", () => {
      register.HL = 0x0001;
      register.BC = 0x0000;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "HL" }, { name: "BC" }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.HL, 0x0001);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    });

    it("handles zero flag", () => {
      register.BC = 0;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "HL" }, { name: "BC" }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.HL, 0x0000, "result is incorrect");
      assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        false,
        "flagHalfCarry is incorrect",
      );
    });

    it("handles carry flag", () => {
      register.HL = 0x8000;
      register.BC = 0x8001;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "HL" }, { name: "BC" }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.HL, 0x0001);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        false,
        "flagHalfCarry is incorrect",
      );
    });

    it("handles half carry flag", () => {
      register.HL = 0x0fff;
      register.BC = 0x0001;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "HL" }, { name: "BC" }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.HL, 0x1000);
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        true,
        "flagHalfCarry is incorrect",
      );
    });
  });

  describe("with SP", () => {
    it("updates SP with positive values", () => {
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [
          { name: "SP", cycles: [1] },
          { name: "e8", value: 1 },
        ],
      });
      add(instruction, register, data);
      assert.strictEqual(register.SP, 0x01);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagHalfCarry, false);
    });

    it("updates SP with negative values", () => {
      register.SP = 0x00ff;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "SP" }, { name: "e8", value: -0x01 }],
      });
      add(instruction, register, data);
      assert.strictEqual(register.SP, 0xfffe);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, true);
      assert.strictEqual(register.flagHalfCarry, true);
    });
  });
});

describe("and", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("performs bitwise AND correctly", () => {
    register.A = 0b10101010;
    register.B = 0b11001100;

    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = and(instruction, register, data);

    assert.strictEqual(register.A, 0b10001000);
    assert.strictEqual(register.flagZero, false);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, true);
    assert.strictEqual(result, 1);
  });

  it("sets zero flag when result is zero", () => {
    register.A = 0b10101010;
    register.B = 0b01010101;
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = and(instruction, register, data);

    assert.strictEqual(register.A, 0b00000000);
    assert.strictEqual(register.flagZero, true);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, true);
    assert.strictEqual(result, 1);
  });

  it("returns INVALID_INSTRUCTION_RETURN for unsupported destination", () => {
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "BC" }, { name: "B" }],
    });
    const result = and(instruction, register, data);

    assert.strictEqual(result, INVALID_INSTRUCTION_RETURN);
  });
});

describe("dec", () => {
  const instruction = /** @type {import('../types').Instruction} */ ({
    operands: [{ name: "A", immediate: true }],
    cycles: [4],
  });

  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("decrements the value in the register", () => {
    register.A = 0x01;
    const cycles = dec(instruction, register, data);
    assert.strictEqual(register.A, 0x00);
    assert.strictEqual(cycles, 4);
  });

  it("sets the zero flag when the result is zero", () => {
    register.A = 0x01;
    dec(instruction, register, data);
    assert.strictEqual(register.flagZero, true);
  });

  it("sets the subtract flag", () => {
    register.flagSubtract = false;
    dec(instruction, register, data);
    assert.strictEqual(register.flagSubtract, true);
  });

  it("sets the half carry flag when there is borrow from bit 4", () => {
    register.A = 0x10;
    dec(instruction, register, data);
    assert.strictEqual(register.flagHalfCarry, true);
  });

  it("handles non-immediate operands", () => {
    const instruction = /** @type {import('../types').Instruction} */ ({
      operands: [{ name: "HL", immediate: false }],
      cycles: [12],
    });

    register.HL = 0x10;
    data.setUint8(register.HL, 0x01);

    const cycles = dec(instruction, register, data);
    assert.strictEqual(data.getUint8(register.HL), 0x00);
    assert.strictEqual(cycles, 12);
  });
});

describe("inc", () => {
  const instruction = /** @type {import('../types').Instruction} */ ({
    operands: [{ name: "A", immediate: true }],
    cycles: [4],
  });

  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("increments the value in the register", () => {
    register.A = 0x01;
    const cycles = inc(instruction, register, data);
    assert.strictEqual(register.A, 0x02);
    assert.strictEqual(cycles, 4);
  });

  it("sets the zero flag when the result is zero", () => {
    register.A = 0xff;
    inc(instruction, register, data);
    assert.strictEqual(register.flagZero, true);
  });

  it("resets the subtract flag", () => {
    register.flagSubtract = true;
    inc(instruction, register, data);
    assert.strictEqual(register.flagSubtract, false);
  });

  it("sets the half carry flag when the lower nibble overflows", () => {
    register.A = 0x0f;
    inc(instruction, register, data);
    assert.strictEqual(register.flagHalfCarry, true);
  });

  it("handles non-immediate operands", () => {
    const instruction = /** @type {import('../types').Instruction} */ ({
      operands: [{ name: "HL", immediate: false }],
      cycles: [12],
    });

    register.HL = 0x10;
    data.setUint8(register.HL, 0x01);

    const cycles = inc(instruction, register, data);
    assert.strictEqual(data.getUint8(register.HL), 0x02);
    assert.strictEqual(cycles, 12);
  });
});

describe("or", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("performs bitwise or correctly", () => {
    register.A = 0b10101010;
    register.B = 0b11001100;

    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = or(instruction, register, data);

    assert.strictEqual(register.A, 0b11101110);
    assert.strictEqual(register.flagZero, false);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(result, 1);
  });

  it("sets zero flag when result is zero", () => {
    register.A = 0b00000000;
    register.B = 0b00000000;
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = or(instruction, register, data);

    assert.strictEqual(register.A, 0b00000000);
    assert.strictEqual(register.flagZero, true);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(result, 1);
  });

  it("returns INVALID_INSTRUCTION_RETURN for unsupported destination", () => {
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "BC" }, { name: "B" }],
    });
    const result = or(instruction, register, data);

    assert.strictEqual(result, INVALID_INSTRUCTION_RETURN);
  });
});

describe("sub", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  describe("with 8-bit registers", () => {
    it("subtracts correctly", () => {
      register.A = 0x02;
      register.B = 0x01;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "A" }, { name: "B" }],
      });
      sub(instruction, register, data);
      assert.strictEqual(register.A, 0x01);
      assert.strictEqual(register.flagZero, false);
      assert.strictEqual(register.flagCarry, false);
      assert.strictEqual(register.flagSubtract, true);
      assert.strictEqual(register.flagHalfCarry, false);
    });

    it("handles zero flag", () => {
      register.A = 0x01;
      register.B = 0x01;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "A" }, { name: "B" }],
      });
      sub(instruction, register, data);
      assert.strictEqual(register.A, 0x00, "result is incorrect");
      assert.strictEqual(register.flagSubtract, true);
      assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        false,
        "flagHalfCarry is incorrect",
      );
    });

    it("handles carry flag", () => {
      register.A = 0x10;
      register.B = 0x20;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "A" }, { name: "B" }],
      });
      sub(instruction, register, data);
      assert.strictEqual(register.A, 0xf0);
      assert.strictEqual(
        register.flagSubtract,
        true,
        "flagSubtract is incorrect",
      );
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        false,
        "flagHalfCarry is incorrect",
      );
    });

    it("handles half carry flag", () => {
      register.A = 0x11;
      register.B = 0x02;
      const instruction = /** @type {import('../types').Instruction} */ ({
        cycles: [1],
        operands: [{ name: "A" }, { name: "B" }],
      });
      sub(instruction, register, data);
      assert.strictEqual(register.A, 0x0f);
      assert.strictEqual(
        register.flagSubtract,
        true,
        "flagSubtract is incorrect",
      );
      assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
      assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
      assert.strictEqual(
        register.flagHalfCarry,
        true,
        "flagHalfCarry is incorrect",
      );
    });
  });
});

describe("xor", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("performs bitwise xor correctly", () => {
    register.A = 0b10101010;
    register.B = 0b11001100;

    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = xor(instruction, register, data);

    assert.strictEqual(register.A, 0b01100110);
    assert.strictEqual(register.flagZero, false);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(result, 1);
  });

  it("sets zero flag when result is zero", () => {
    register.A = 0b11111111;
    register.B = 0b11111111;
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = xor(instruction, register, data);

    assert.strictEqual(register.A, 0b00000000);
    assert.strictEqual(register.flagZero, true);
    assert.strictEqual(register.flagCarry, false);
    assert.strictEqual(register.flagSubtract, false);
    assert.strictEqual(register.flagHalfCarry, false);
    assert.strictEqual(result, 1);
  });

  it("returns INVALID_INSTRUCTION_RETURN for unsupported destination", () => {
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "BC" }, { name: "B" }],
    });
    const result = xor(instruction, register, data);

    assert.strictEqual(result, INVALID_INSTRUCTION_RETURN);
  });
});

describe("cp", () => {
  let data, register;
  beforeEach(() => {
    data = makeData();
    register = makeEmptyRegister();
  });

  it("performs subtraction correctly", () => {
    register.A = 0x11;
    register.B = 0x01;

    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = cp(instruction, register, data);

    assert.strictEqual(register.A, 0x11, "A should not be modified");
    assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
    assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
    assert.strictEqual(
      register.flagSubtract,
      true,
      "flagSubtract is incorrect",
    );
    assert.strictEqual(
      register.flagHalfCarry,
      false,
      "flagHalfCarry is incorrect",
    );
    assert.strictEqual(result, 1);
  });

  it("sets zero flag when result is zero", () => {
    register.A = 0x10;
    register.B = 0x10;
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = cp(instruction, register, data);

    assert.strictEqual(register.A, 0x10, "A should not be modified");
    assert.strictEqual(register.flagZero, true, "flagZero is incorrect");
    assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
    assert.strictEqual(
      register.flagSubtract,
      true,
      "flagSubtract is incorrect",
    );
    assert.strictEqual(
      register.flagHalfCarry,
      false,
      "flagHalfCarry is incorrect",
    );
    assert.strictEqual(result, 1);
  });

  it("sets carry flag when result is negative", () => {
    register.A = 0x10;
    register.B = 0x20;
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = cp(instruction, register, data);

    assert.strictEqual(register.A, 0x10, "A should not be modified");
    assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
    assert.strictEqual(register.flagCarry, true, "flagCarry is incorrect");
    assert.strictEqual(
      register.flagSubtract,
      true,
      "flagSubtract is incorrect",
    );
    assert.strictEqual(
      register.flagHalfCarry,
      false,
      "flagHalfCarry is incorrect",
    );
    assert.strictEqual(result, 1);
  });

  it("sets half carry flag when there is a borrow from bit 4", () => {
    register.A = 0x10;
    register.B = 0x01;
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "A" }, { name: "B" }],
    });
    const result = cp(instruction, register, data);

    assert.strictEqual(register.A, 0x10, "A should not be modified");
    assert.strictEqual(register.flagZero, false, "flagZero is incorrect");
    assert.strictEqual(register.flagCarry, false, "flagCarry is incorrect");
    assert.strictEqual(
      register.flagSubtract,
      true,
      "flagSubtract is incorrect",
    );
    assert.strictEqual(
      register.flagHalfCarry,
      true,
      "flagHalfCarry is incorrect",
    );
    assert.strictEqual(result, 1);
  });

  it("returns INVALID_INSTRUCTION_RETURN for unsupported destination", () => {
    const instruction = /** @type {import('../types').Instruction} */ ({
      cycles: [1],
      operands: [{ name: "BC" }, { name: "B" }],
    });
    const result = cp(instruction, register, data);

    assert.strictEqual(result, INVALID_INSTRUCTION_RETURN);
  });
});
