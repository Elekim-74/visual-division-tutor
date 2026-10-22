// Guided "work it out together" mode (PROTOTYPE).
// Pure logic only: no DOM. The learner guesses, the tutor checks with
// deterministic arithmetic and asks the next question.

import { validateInputs } from "./division.js";

const MAX_TRIES = 2; // wrong answers before the tutor shows the answer
const BENCHMARKS = [100, 50, 20, 10, 5, 2, 1];

function plural(n, one, many) {
  return n === 1 ? one : many;
}

function groupsOf(n, divisor) {
  return `${n} ${plural(n, "group", "groups")} of ${divisor}`;
}

function readWhole(input) {
  const raw = String(input ?? "").trim();
  if (!/^\d+$/.test(raw)) return null;
  return Number(raw);
}

function readYesNo(input) {
  const raw = String(input ?? "").trim().toLowerCase();
  if (["yes", "y"].includes(raw)) return true;
  if (["no", "n"].includes(raw)) return false;
  return null;
}

function benchmarkHint(remaining, divisor) {
  const k = BENCHMARKS.find((b) => b * divisor <= remaining) ?? 1;
  return `Tip: ${groupsOf(k, divisor)} is ${k * divisor}, and that fits inside ${remaining}.`;
}

function productHint(groups, divisor) {
  if (groups <= 12) {
    const firstFew = [1, 2, 3].filter((n) => n <= groups).map((n) => n * divisor).join(", ");
    return `Count in ${divisor}s: ${firstFew}… keep going until you have said ${groups} ${plural(groups, "number", "numbers")}.`;
  }
  const tens = Math.floor(groups / 10) * 10;
  const ones = groups - tens;
  if (ones === 0) {
    return `Try ${groups / 10} × ${divisor}, then times by 10.`;
  }
  return `Split it up: ${tens} × ${divisor} plus ${ones} × ${divisor}.`;
}

function guessPrompt(state) {
  if (state.chunks.length === 0) {
    return { kind: "number", text: `How many groups of ${state.divisor} do you think are in ${state.remaining}?` };
  }
  return { kind: "number", text: `How many more groups of ${state.divisor} do you think we can make from ${state.remaining}?` };
}

function totalGroups(state) {
  return state.chunks.reduce((sum, chunk) => sum + chunk.groups, 0);
}

function next(state, changes, feedback, prompt) {
  return { ...state, ...changes, feedback, prompt };
}

function finish(state) {
  const quotient = totalGroups(state);
  const remainder = state.remaining;
  const done = {
    phase: "done",
    quotient,
    remainder,
  };
  return next(state, done, null, {
    kind: "none",
    text: `${state.dividend} ÷ ${state.divisor} = ${quotient} remainder ${remainder}. Check: ${quotient} × ${state.divisor} + ${remainder} = ${state.dividend}.`,
  });
}

function toTotalOrFinish(state, feedback) {
  if (state.chunks.length >= 2) {
    const sum = state.chunks.map((chunk) => chunk.groups).join(" + ");
    return next(state, { phase: "total", tries: 0 }, feedback, {
      kind: "number",
      text: `Let's add up all your groups: ${sum} = ?`,
    });
  }
  const finished = finish(state);
  return { ...finished, feedback };
}

export function createGuidedSession(dividend, divisor) {
  validateInputs(dividend, divisor);
  const state = {
    dividend,
    divisor,
    remaining: dividend,
    phase: "guess",
    guess: null,
    product: null,
    tries: 0,
    tooMany: 0,
    chunks: [],
    feedback: null,
    prompt: null,
  };
  if (dividend < divisor) {
    return {
      ...state,
      phase: "more",
      prompt: { kind: "yesno", text: `Can we make even one group of ${divisor} from ${dividend}?` },
    };
  }
  return { ...state, prompt: guessPrompt(state) };
}

export function respond(state, input) {
  const { divisor, remaining } = state;

  if (state.phase === "guess") {
    const guess = readWhole(input);
    if (guess === null) {
      return next(state, {}, { tone: "info", text: "Type a whole number, like 5 or 10." }, state.prompt);
    }
    if (guess === 0) {
      return next(state, {}, { tone: "hint", text: "Let's try at least 1 group." }, state.prompt);
    }
    return next(state, { phase: "product", guess, tries: 0 }, null, {
      kind: "number",
      text: `Let's check. What is ${groupsOf(guess, divisor)}?`,
    });
  }

  if (state.phase === "product") {
    const answer = readWhole(input);
    const product = state.guess * divisor;
    if (answer === null) {
      return next(state, {}, { tone: "info", text: "Type a whole number." }, state.prompt);
    }
    let feedback;
    if (answer === product) {
      feedback = { tone: "correct", text: `Yes, ${groupsOf(state.guess, divisor)} is ${product}.` };
    } else if (state.tries + 1 < MAX_TRIES) {
      return next(state, { tries: state.tries + 1 }, {
        tone: "hint",
        text: `Not quite. ${productHint(state.guess, divisor)}`,
      }, state.prompt);
    } else {
      feedback = { tone: "reveal", text: `${groupsOf(state.guess, divisor)} is ${product} (${state.guess} × ${divisor} = ${product}).` };
    }

    if (product > remaining) {
      const tooMany = state.tooMany + 1;
      const extra = tooMany >= 2 ? ` ${benchmarkHint(remaining, divisor)}` : "";
      return next(state, { phase: "guess", guess: null, tries: 0, tooMany }, {
        tone: "hint",
        text: `${feedback.text} But we only have ${remaining}, and ${product} is more than that. So ${state.guess} groups is too many. Try fewer.${extra}`,
      }, guessPrompt(state));
    }

    return next(state, { phase: "leftover", product, tries: 0 }, feedback, {
      kind: "number",
      text: `We had ${remaining}. We used ${product}. How many are left?`,
    });
  }

  if (state.phase === "leftover") {
    const answer = readWhole(input);
    const left = remaining - state.product;
    if (answer === null) {
      return next(state, {}, { tone: "info", text: "Type a whole number." }, state.prompt);
    }
    let feedback;
    if (answer === left) {
      feedback = { tone: "correct", text: `That's right, ${left} ${plural(left, "is", "are")} left.` };
    } else if (state.tries + 1 < MAX_TRIES) {
      return next(state, { tries: state.tries + 1 }, {
        tone: "hint",
        text: `Not quite. Count up from ${state.product} to ${remaining}, or work out ${remaining} − ${state.product}.`,
      }, state.prompt);
    } else {
      feedback = { tone: "reveal", text: `${remaining} − ${state.product} = ${left}, so ${left} ${plural(left, "is", "are")} left.` };
    }

    const chunk = { groups: state.guess, groupSize: divisor, value: state.product, before: remaining, after: left };
    return next(state, {
      phase: "more",
      remaining: left,
      chunks: [...state.chunks, chunk],
      guess: null,
      product: null,
      tries: 0,
      tooMany: 0,
    }, feedback, {
      kind: "yesno",
      text: `We have ${left} left. Do you think we could make any more groups of ${divisor}?`,
    });
  }

  if (state.phase === "more") {
    const yes = readYesNo(input);
    if (yes === null) {
      return next(state, {}, { tone: "info", text: "Choose Yes or No." }, state.prompt);
    }
    const canMakeMore = remaining >= divisor;

    if (yes && canMakeMore) {
      return next(state, { phase: "guess", tries: 0 }, {
        tone: "correct",
        text: `Yes, ${remaining} is at least ${divisor}, so there is room for more.`,
      }, guessPrompt(state));
    }
    if (!yes && !canMakeMore) {
      return toTotalOrFinish(state, {
        tone: "correct",
        text: state.chunks.length === 0
          ? `Right. ${remaining} is less than ${divisor}, so we can't make even one group. All ${remaining} ${plural(remaining, "is", "are")} left over, so the remainder is ${remaining}.`
          : `Right. ${remaining} is less than ${divisor}, so we can't make another full group. The ${remaining} left over is the remainder.`,
      });
    }
    if (state.tries + 1 < MAX_TRIES) {
      const hint = canMakeMore
        ? `Look again. We have ${remaining}, and one group needs ${divisor}. Is ${remaining} more than ${divisor}?`
        : `Look again. Can we make a group of ${divisor} from only ${remaining}?`;
      return next(state, { tries: state.tries + 1 }, { tone: "hint", text: hint }, state.prompt);
    }
    if (canMakeMore) {
      return next(state, { phase: "guess", tries: 0 }, {
        tone: "reveal",
        text: `We can, because ${remaining} is more than ${divisor}.`,
      }, guessPrompt(state));
    }
    return toTotalOrFinish(state, {
      tone: "reveal",
      text: `We can't, because ${remaining} is less than ${divisor}. The ${remaining} left over is the remainder.`,
    });
  }

  if (state.phase === "total") {
    const answer = readWhole(input);
    const total = totalGroups(state);
    if (answer === null) {
      return next(state, {}, { tone: "info", text: "Type a whole number." }, state.prompt);
    }
    if (answer !== total && state.tries + 1 < MAX_TRIES) {
      return next(state, { tries: state.tries + 1 }, {
        tone: "hint",
        text: "Not quite. Add them one at a time.",
      }, state.prompt);
    }
    const done = finish(state);
    const feedback = answer === total
      ? { tone: "correct", text: `Yes, ${total} groups altogether.` }
      : { tone: "reveal", text: `${state.chunks.map((c) => c.groups).join(" + ")} = ${total} groups altogether.` };
    return { ...done, feedback };
  }

  return state;
}
