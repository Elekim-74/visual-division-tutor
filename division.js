const PREFERRED_CHUNK_SIZES = Object.freeze([20, 10, 5, 2, 1]);

function isInteger(value) {
  return Number.isInteger(value);
}

export function validateInputs(dividend, divisor) {
  if (!isInteger(dividend) || dividend < 1 || dividend > 10000) {
    throw new Error("Please enter a whole number from 1 to 10,000 for the dividend.");
  }

  if (!isInteger(divisor) || divisor < 2 || divisor > 100) {
    throw new Error("Please enter a whole number from 2 to 100 for the divisor.");
  }
}

export function calculateDivision(dividend, divisor) {
  validateInputs(dividend, divisor);

  const chunks = [];
  let remaining = dividend;

  while (remaining >= divisor) {
    const availableGroups = Math.floor(remaining / divisor);
    const chunkSize = PREFERRED_CHUNK_SIZES.find((size) => size <= availableGroups);
    const groups = chunkSize ?? 1;
    const value = groups * divisor;
    const before = remaining;
    const after = before - value;

    chunks.push({
      groups,
      groupSize: divisor,
      value,
      before,
      after,
    });

    remaining = after;
  }

  const quotient = chunks.reduce((total, chunk) => total + chunk.groups, 0);
  const remainder = remaining;

  return {
    dividend,
    divisor,
    quotient,
    remainder,
    chunks,
  };
}

export function validateCalculation(calculation) {
  const failures = [];
  const { dividend, divisor, quotient, remainder, chunks } = calculation ?? {};

  if (dividend !== divisor * quotient + remainder) {
    failures.push("dividend !== divisor * quotient + remainder");
  }

  if (!(remainder >= 0)) {
    failures.push("remainder is less than 0");
  }

  if (!(remainder < divisor)) {
    failures.push("remainder is not less than divisor");
  }

  const chunkList = Array.isArray(chunks) ? chunks : [];
  const groupTotal = chunkList.reduce((total, chunk) => total + chunk.groups, 0);
  if (groupTotal !== quotient) {
    failures.push("sum of chunk.groups !== quotient");
  }

  chunkList.forEach((chunk, index) => {
    if (chunk.value !== chunk.groups * divisor) {
      failures.push(`chunk ${index + 1}: value !== groups * divisor`);
    }

    if (chunk.before - chunk.value !== chunk.after) {
      failures.push(`chunk ${index + 1}: before - value !== after`);
    }

    if (index === 0 && chunk.before !== dividend) {
      failures.push("first chunk.before !== dividend");
    }

    if (index > 0 && chunkList[index - 1].after !== chunk.before) {
      failures.push(`chunk ${index + 1}: before does not match previous after`);
    }
  });

  if (chunkList.length > 0 && chunkList.at(-1).after !== remainder) {
    failures.push("final chunk.after !== remainder");
  }

  if (chunkList.length === 0 && quotient !== 0) {
    failures.push("missing chunks for a non-zero quotient");
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}

export { PREFERRED_CHUNK_SIZES };
