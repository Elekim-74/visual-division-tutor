import test from "node:test";
import assert from "node:assert/strict";
import { calculateDivision, validateCalculation } from "../division.js";

const examples = [
  [398, 11, 36, 2],
  [223, 12, 18, 7],
  [144, 12, 12, 0],
  [100, 7, 14, 2],
  [7, 11, 0, 7],
  [999, 25, 39, 24],
];

for (const [dividend, divisor, quotient, remainder] of examples) {
  test(`${dividend} ÷ ${divisor}`, () => {
    const calculation = calculateDivision(dividend, divisor);

    assert.equal(calculation.quotient, quotient);
    assert.equal(calculation.remainder, remainder);
    assert.equal(validateCalculation(calculation).valid, true);
    assert.equal(
      calculation.chunks.reduce((total, chunk) => total + chunk.groups, 0),
      quotient,
    );
    for (const chunk of calculation.chunks) {
      assert.equal(chunk.value, chunk.groups * divisor);
    }
  });
}

test("exact division has no remainder", () => {
  const calculation = calculateDivision(48, 6);
  assert.equal(calculation.quotient, 8);
  assert.equal(calculation.remainder, 0);
  assert.equal(validateCalculation(calculation).valid, true);
});

test("398 ÷ 11 uses the requested large-chunk sequence", () => {
  const calculation = calculateDivision(398, 11);
  assert.deepEqual(
    calculation.chunks.map(({ groups, groupSize, value, before, after }) => ({
      groups,
      groupSize,
      value,
      before,
      after,
    })),
    [
      { groups: 20, groupSize: 11, value: 220, before: 398, after: 178 },
      { groups: 10, groupSize: 11, value: 110, before: 178, after: 68 },
      { groups: 5, groupSize: 11, value: 55, before: 68, after: 13 },
      { groups: 1, groupSize: 11, value: 11, before: 13, after: 2 },
    ],
  );
});

test("a dividend smaller than the divisor creates no chunks", () => {
  const calculation = calculateDivision(3, 8);
  assert.equal(calculation.quotient, 0);
  assert.equal(calculation.remainder, 3);
  assert.deepEqual(calculation.chunks, []);
  assert.equal(validateCalculation(calculation).valid, true);
});

test("rejects invalid input", () => {
  const invalidInputs = [
    [0, 2],
    [-1, 2],
    [2.5, 2],
    [10, 0],
    [10, -2],
    [10, 2.5],
    [10001, 2],
    [10, 101],
    ["10", 2],
  ];

  for (const [dividend, divisor] of invalidInputs) {
    assert.throws(() => calculateDivision(dividend, divisor));
  }
});

test("property stress test: every supported combination validates", () => {
  for (let dividend = 1; dividend <= 1000; dividend += 1) {
    for (let divisor = 2; divisor <= 50; divisor += 1) {
      const calculation = calculateDivision(dividend, divisor);

      assert.equal(dividend, calculation.quotient * divisor + calculation.remainder);
      assert.ok(calculation.remainder >= 0);
      assert.ok(calculation.remainder < divisor);
      assert.equal(
        calculation.chunks.reduce((total, chunk) => total + chunk.groups, 0),
        calculation.quotient,
      );

      for (const chunk of calculation.chunks) {
        assert.equal(chunk.value, chunk.groups * divisor);
      }

      assert.equal(validateCalculation(calculation).valid, true);
    }
  }
});
