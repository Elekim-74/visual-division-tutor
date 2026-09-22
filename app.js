import { calculateDivision, validateCalculation } from "./division.js";

const form = document.querySelector("#division-form");
const dividendInput = document.querySelector("#dividend");
const divisorInput = document.querySelector("#divisor");
const errorMessage = document.querySelector("#error-message");
const results = document.querySelector("#results");
const validationMessage = document.querySelector("#validation-message");
const resetButton = document.querySelector("#reset-button");

function setMessage(element, message, type = "error") {
  element.textContent = message;
  element.className = `message ${type}`;
  element.hidden = !message;
}

function clearResults() {
  results.replaceChildren();
  results.hidden = true;
  setMessage(validationMessage, "");
}

function readWholeNumber(input) {
  const raw = input.value.trim();
  if (raw === "" || !/^\d+$/.test(raw)) {
    return null;
  }
  return Number(raw);
}

export function createGroup(groupSize) {
  if (!Number.isInteger(groupSize) || groupSize < 1) {
    throw new Error("A visual group must contain a positive whole number of counters.");
  }

  const group = document.createElement("div");
  group.className = "group";
  group.dataset.groupSize = String(groupSize);
  group.setAttribute("role", "img");
  group.setAttribute("aria-label", `A group containing ${groupSize} counters`);

  for (let i = 0; i < groupSize; i += 1) {
    const counter = document.createElement("span");
    counter.className = "counter";
    counter.setAttribute("aria-hidden", "true");
    group.appendChild(counter);
  }

  return group;
}

function createRemainderCounters(remainder) {
  const counterTray = document.createElement("div");
  counterTray.className = "remainder-counters";
  const counterNoun = remainder === 1 ? "counter" : "counters";
  const remainderVerb = remainder === 1 ? "is" : "are";
  counterTray.setAttribute("aria-label", `${remainder} ${counterNoun} ${remainderVerb} left over`);

  for (let i = 0; i < remainder; i += 1) {
    const counter = document.createElement("span");
    counter.className = "counter remainder-counter";
    counter.setAttribute("aria-hidden", "true");
    counterTray.appendChild(counter);
  }

  return counterTray;
}

function renderGroupVisual(chunk) {
  const visual = document.createElement("div");
  visual.className = "group-visual";
  visual.dataset.groupCount = String(chunk.groups);

  const groupList = document.createElement("div");
  groupList.className = "group-list";

  if (chunk.groups >= 20) {
    const cue = document.createElement("p");
    cue.className = "group-cue";
    const half = chunk.groups / 2;
    cue.textContent = `${half} groups + another ${half} groups = ${chunk.groups} groups`;
    visual.appendChild(cue);
  }

  for (let i = 0; i < chunk.groups; i += 1) {
    groupList.appendChild(createGroup(chunk.groupSize));
  }

  visual.appendChild(groupList);
  return visual;
}

function renderChunk(chunk, index, calculation) {
  const card = document.createElement("article");
  card.className = "step-card";

  const heading = document.createElement("h2");
  heading.textContent = `Step ${index + 1}`;

  const teachingSentence = document.createElement("p");
  teachingSentence.className = "teaching-sentence";
  if (index === 0) {
    teachingSentence.textContent = `We are sharing ${calculation.dividend} into groups of ${calculation.divisor}. Let’s make ${chunk.groups} groups first.`;
  } else if (chunk.groups >= 10) {
    teachingSentence.textContent = `Another ${chunk.groups} groups of ${chunk.groupSize} make ${chunk.value}.`;
  } else if (chunk.groups === 1) {
    teachingSentence.textContent = `We can make 1 more group of ${chunk.groupSize}.`;
  } else {
    teachingSentence.textContent = `We can make ${chunk.groups} more groups of ${chunk.groupSize}.`;
  }

  const visualRow = document.createElement("div");
  visualRow.className = "visual-row";
  visualRow.appendChild(renderGroupVisual(chunk));

  const equation = document.createElement("p");
  equation.className = "equation";
  equation.textContent = `${chunk.groups} × ${chunk.groupSize} = ${chunk.value}`;

  const left = document.createElement("p");
  left.className = "left-amount";
  if (chunk.after === 0) {
    left.textContent = "Now 0 are left.";
  } else {
    const counterNoun = chunk.after === 1 ? "counter" : "counters";
    const leftVerb = chunk.after === 1 ? "is" : "are";
    left.textContent = `Now ${chunk.after} ${counterNoun} ${leftVerb} left.`;
  }

  card.append(heading, teachingSentence, visualRow, equation, left);
  return card;
}

function renderRemainder(calculation) {
  const card = document.createElement("article");
  card.className = "remainder-card";

  const heading = document.createElement("h2");
  heading.textContent = "What is left over?";

  const visualRow = document.createElement("div");
  visualRow.className = "visual-row remainder-row";
  visualRow.append(createRemainderCounters(calculation.remainder));

  const label = document.createElement("p");
  label.className = "remainder-label";
  if (calculation.quotient === 0) {
    const leftoverPhrase = calculation.dividend === 1
      ? "the 1 is"
      : `all ${calculation.dividend} are`;
    label.textContent = `${calculation.dividend} is too small to make even one group of ${calculation.divisor}, so ${leftoverPhrase} left over.`;
  } else if (calculation.remainder === 0) {
    label.textContent = "Nothing is left over, so the remainder is 0.";
  } else {
    const counterNoun = calculation.remainder === 1 ? "counter" : "counters";
    const remainderVerb = calculation.remainder === 1 ? "is" : "are";
    label.textContent = `${calculation.remainder} ${counterNoun} ${remainderVerb} left over, so the remainder is ${calculation.remainder}.`;
  }

  card.append(heading, visualRow, label);
  return card;
}

function renderFinalAnswer(calculation) {
  const card = document.createElement("section");
  card.className = "final-card";

  const heading = document.createElement("h2");
  heading.textContent = "Our answer";

  if (calculation.chunks.length > 0) {
    const summary = document.createElement("p");
    summary.className = "quotient-summary";
    const partialQuotients = calculation.chunks.map((chunk) => chunk.groups).join(" + ");
    const groupWord = calculation.quotient === 1 ? "group" : "groups";
    summary.textContent = `Putting it together: ${partialQuotients} = ${calculation.quotient} ${groupWord}.`;
    card.append(heading, summary);
  } else {
    card.append(heading);
  }

  const answer = document.createElement("p");
  answer.className = "final-answer";
  answer.textContent = `${calculation.dividend} ÷ ${calculation.divisor} = ${calculation.quotient} remainder ${calculation.remainder}`;

  const explanation = document.createElement("p");
  explanation.className = "quotient-explanation";
  const groupWord = calculation.quotient === 1 ? "group" : "groups";
  explanation.textContent = `We made ${calculation.quotient} equal ${groupWord} of ${calculation.divisor}, with ${calculation.remainder} left over.`;

  card.append(answer, explanation);
  return card;
}

export function validateRenderedGroups(root = document) {
  const visualChunks = root.querySelectorAll(".group-visual");
  const groups = root.querySelectorAll(".group");
  const failures = [];

  visualChunks.forEach((visual, index) => {
    const expectedGroups = Number(visual.dataset.groupCount);
    const actualGroups = visual.querySelectorAll(".group").length;

    if (!Number.isInteger(expectedGroups) || actualGroups !== expectedGroups) {
      failures.push(`chunk ${index + 1}: expected ${expectedGroups} groups but found ${actualGroups}`);
    }
  });

  groups.forEach((group, index) => {
    const expected = Number(group.dataset.groupSize);
    const actual = group.querySelectorAll(".counter").length;

    if (!Number.isInteger(expected) || actual !== expected) {
      failures.push(`visual group ${index + 1}: expected ${expected} counters but found ${actual}`);
    }
  });

  if (failures.length > 0) {
    console.error("Visual validation failed:", failures);
    const diagram = root.id === "results" ? root : root.querySelector("#results");
    if (diagram) {
      diagram.replaceChildren();
      diagram.hidden = true;
    }
    const message = root.id === "results"
      ? document.querySelector("#validation-message")
      : root.querySelector("#validation-message");
    if (message) {
      message.textContent = "Visual validation error — incorrect group detected.";
      message.className = "message error";
      message.hidden = false;
    }
    return false;
  }

  return true;
}

export function renderCalculation(calculation) {
  const validation = validateCalculation(calculation);
  if (!validation.valid) {
    console.error("Maths validation failed:", validation.failures);
    clearResults();
    setMessage(validationMessage, "Maths validation error — diagram not shown.");
    return false;
  }

  results.replaceChildren();
  calculation.chunks.forEach((chunk, index) => {
    results.appendChild(renderChunk(chunk, index, calculation));
  });
  results.append(renderRemainder(calculation), renderFinalAnswer(calculation));
  results.hidden = false;

  return validateRenderedGroups(results);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearResults();
  setMessage(errorMessage, "");

  const dividend = readWholeNumber(dividendInput);
  const divisor = readWholeNumber(divisorInput);

  try {
    const calculation = calculateDivision(dividend, divisor);
    renderCalculation(calculation);
  } catch (error) {
    setMessage(errorMessage, error.message);
  }
});

resetButton.addEventListener("click", () => {
  form.reset();
  clearResults();
  setMessage(errorMessage, "");
  dividendInput.focus();
});
