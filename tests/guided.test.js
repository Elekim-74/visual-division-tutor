import test from "node:test";
import assert from "node:assert/strict";
import { createGuidedSession, respond } from "../guided.js";

function play(dividend, divisor, answers) {
  let state = createGuidedSession(dividend, divisor);
  const transcript = [state.prompt.text];
  for (const answer of answers) {
    state = respond(state, answer);
    if (state.feedback) transcript.push(state.feedback.text);
    transcript.push(state.prompt.text);
  }
  return { state, transcript };
}

test("108 ÷ 10: right first guess of 10 groups finishes with 10 remainder 8", () => {
  const { state, transcript } = play(108, 10, ["10", "100", "8", "no"]);
  assert.equal(transcript[0], "How many groups of 10 do you think are in 108?");
  assert.equal(state.phase, "done");
  assert.equal(state.quotient, 10);
  assert.equal(state.remainder, 8);
});

test("98 ÷ 10: guess of 8 leads to 'any more?' and finishes with 9 remainder 8", () => {
  let state = createGuidedSession(98, 10);
  state = respond(state, "8");
  assert.equal(state.prompt.text, "Let's check. What is 8 groups of 10?");
  state = respond(state, "80");
  assert.equal(state.feedback.tone, "correct");
  assert.equal(state.prompt.text, "We had 98. We used 80. How many are left?");
  state = respond(state, "18");
  assert.equal(state.prompt.kind, "yesno");
  assert.match(state.prompt.text, /We have 18 left/);
  state = respond(state, "yes");
  assert.equal(state.prompt.text, "How many more groups of 10 do you think we can make from 18?");
  state = respond(state, "1");
  state = respond(state, "10");
  state = respond(state, "8");
  state = respond(state, "no");
  assert.equal(state.phase, "total");
  assert.equal(state.prompt.text, "Let's add up all your groups: 8 + 1 = ?");
  state = respond(state, "9");
  assert.equal(state.phase, "done");
  assert.equal(state.quotient, 9);
  assert.equal(state.remainder, 8);
  assert.match(state.prompt.text, /Check: 9 × 10 \+ 8 = 98/);
});

test("too-big guess is caught after she works out the product, and she tries again", () => {
  let state = createGuidedSession(98, 10);
  state = respond(state, "10");
  state = respond(state, "100");
  assert.equal(state.phase, "guess");
  assert.match(state.feedback.text, /100 is more than that\. So 10 groups is too many/);
  assert.equal(state.remaining, 98);
});

test("second too-big guess adds a benchmark tip", () => {
  let state = createGuidedSession(98, 10);
  state = respond(state, "12");
  state = respond(state, "120");
  state = respond(state, "11");
  state = respond(state, "110");
  assert.match(state.feedback.text, /Tip: 5 groups of 10 is 50/);
});

test("wrong product keeps getting hints, never the answer, and they get more specific", () => {
  let state = createGuidedSession(98, 10);
  state = respond(state, "8");
  state = respond(state, "70");
  assert.equal(state.feedback.tone, "hint");
  assert.match(state.feedback.text, /Count in 10s: 10, 20, 30…/);
  assert.equal(state.phase, "product");
  assert.equal(state.showMeUnlocked, false);
  state = respond(state, "90");
  assert.match(state.feedback.text, /10, 20, 30, 40, 50, 60, 70… what comes next\?/);
  assert.equal(state.phase, "product");
  assert.equal(state.showMeUnlocked, false);
  assert.doesNotMatch(state.feedback.text, /\b80\b/);
  state = respond(state, "60");
  assert.equal(state.phase, "product");
  assert.equal(state.showMeUnlocked, true);
  assert.match(state.feedback.text, /you can now press “Just show me the working”/);
  state = respond(state, "80");
  assert.equal(state.phase, "leftover");
  assert.equal(state.showMeUnlocked, true, "stays unlocked for the rest of this problem");
});

test("3 wrong tries at how many are left unlocks show-me; 2 do not", () => {
  let state = createGuidedSession(98, 10);
  state = respond(state, "8");
  state = respond(state, "80");
  state = respond(state, "8");
  state = respond(state, "28");
  assert.equal(state.showMeUnlocked, false);
  assert.match(state.feedback.text, /Count up from 80: first jump to 90, that's 10/);
  state = respond(state, "17");
  assert.equal(state.showMeUnlocked, true);
  assert.equal(state.phase, "leftover");
});

test("wrong tries on different questions do not add up", () => {
  let state = createGuidedSession(98, 10);
  state = respond(state, "8");
  state = respond(state, "70");
  state = respond(state, "90");
  state = respond(state, "80");
  state = respond(state, "8");
  state = respond(state, "28");
  assert.equal(state.showMeUnlocked, false);
});

test("3 too-big guesses in a row unlock show-me", () => {
  let state = createGuidedSession(98, 10);
  for (const guess of ["12", "11", "10"]) {
    state = respond(state, guess);
    state = respond(state, String(Number(guess) * 10));
  }
  assert.equal(state.phase, "guess");
  assert.equal(state.showMeUnlocked, true);
});

test("saying 'no more' when more groups fit gets a nudge", () => {
  let state = createGuidedSession(98, 10);
  state = respond(state, "8");
  state = respond(state, "80");
  state = respond(state, "18");
  state = respond(state, "no");
  assert.equal(state.phase, "more");
  assert.match(state.feedback.text, /Is 18 more than 10\?/);
});

test("saying 'yes more' when nothing fits gets a nudge", () => {
  let state = createGuidedSession(108, 10);
  state = respond(state, "10");
  state = respond(state, "100");
  state = respond(state, "8");
  state = respond(state, "yes");
  assert.equal(state.phase, "more");
  assert.match(state.feedback.text, /only 8/);
});

test("non-numbers and zero do not use up a try", () => {
  let state = createGuidedSession(47, 5);
  state = respond(state, "lots");
  assert.equal(state.phase, "guess");
  state = respond(state, "0");
  assert.equal(state.phase, "guess");
  assert.match(state.feedback.text, /at least 1 group/);
});

test("every complete session ends with dividend = quotient × divisor + remainder", () => {
  for (const [dividend, divisor, firstGuess] of [[47, 5, 5], [280, 14, 20], [7, 9, 1], [10000, 100, 50]]) {
    let state = createGuidedSession(dividend, divisor);
    let guard = 0;
    while (state.phase !== "done" && guard < 200) {
      guard += 1;
      if (state.phase === "guess") {
        const fits = Math.floor(state.remaining / divisor);
        state = respond(state, String(Math.max(1, Math.min(firstGuess, fits))));
      } else if (state.phase === "product") {
        state = respond(state, String(state.guess * divisor));
      } else if (state.phase === "leftover") {
        state = respond(state, String(state.remaining - state.product));
      } else if (state.phase === "more") {
        state = respond(state, state.remaining >= divisor ? "yes" : "no");
      } else if (state.phase === "total") {
        state = respond(state, String(state.chunks.reduce((s, c) => s + c.groups, 0)));
      }
    }
    assert.equal(state.phase, "done");
    assert.equal(dividend, state.quotient * divisor + state.remainder);
    assert.ok(state.remainder < divisor);
  }
});

test("7 ÷ 9 asks whether even one group fits and finishes with 0 remainder 7", () => {
  let state = createGuidedSession(7, 9);
  assert.equal(state.prompt.text, "Can we make even one group of 9 from 7?");
  state = respond(state, "no");
  assert.equal(state.phase, "done");
  assert.equal(state.quotient, 0);
  assert.equal(state.remainder, 7);
});
