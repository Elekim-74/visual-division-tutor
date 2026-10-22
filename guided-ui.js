// Guided "work it out together" screen (PROTOTYPE).
import { createGuidedSession, respond } from "./guided.js";
import { createGroup } from "./app.js";

const MAX_DRAWN_GROUPS = 20;

const form = document.querySelector("#division-form");
const guidedButton = document.querySelector("#guided-button");
const resetButton = document.querySelector("#reset-button");
const dividendInput = document.querySelector("#dividend");
const divisorInput = document.querySelector("#divisor");
const errorMessage = document.querySelector("#error-message");
const results = document.querySelector("#results");
const validationMessage = document.querySelector("#validation-message");
const panel = document.querySelector("#guided");

let session = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function readWholeNumber(input) {
  const raw = input.value.trim();
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

function hidePanel() {
  session = null;
  panel.replaceChildren();
  panel.hidden = true;
}

function tallyText(state) {
  const groups = state.chunks.reduce((sum, chunk) => sum + chunk.groups, 0);
  return `Groups so far: ${groups}  ·  Left to share: ${state.remaining}`;
}

function chunkVisual(chunk) {
  const wrap = el("div", "guided-visual");
  const list = el("div", "group-list");
  if (chunk.groups <= MAX_DRAWN_GROUPS) {
    for (let i = 0; i < chunk.groups; i += 1) list.appendChild(createGroup(chunk.groupSize));
    wrap.appendChild(list);
  } else {
    const row = el("div", "visual-row");
    row.append(createGroup(chunk.groupSize), el("span", "multiplier", `× ${chunk.groups}`));
    wrap.appendChild(row);
  }
  wrap.appendChild(el("p", "equation", `${chunk.groups} × ${chunk.groupSize} = ${chunk.value}`));
  return wrap;
}

function bubble(chat, who, text, tone = "") {
  const b = el("p", `bubble ${who}${tone ? ` ${tone}` : ""}`, text);
  chat.appendChild(b);
  return b;
}

function renderAnswerArea(area, state, chat) {
  area.replaceChildren();
  const prompt = state.prompt;

  if (prompt.kind === "number") {
    const row = el("form", "answer-row");
    const input = el("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Your answer");
    const check = el("button", "", "Check");
    check.type = "submit";
    row.append(input, check);
    row.addEventListener("submit", (event) => {
      event.preventDefault();
      if (input.value.trim() === "") return;
      take(input.value.trim(), chat, area);
    });
    area.appendChild(row);
    input.focus();
    return;
  }

  if (prompt.kind === "yesno") {
    const row = el("div", "answer-row yesno");
    for (const label of ["Yes", "No"]) {
      const b = el("button", label === "No" ? "secondary-button" : "", label);
      b.type = "button";
      b.addEventListener("click", () => take(label, chat, area));
      row.appendChild(b);
    }
    area.appendChild(row);
    row.firstChild.focus();
    return;
  }

  area.appendChild(el("p", "guided-done", "Change the numbers above and press “Let’s work it out together” to try another."));
}

function take(answer, chat, area) {
  const before = session.chunks.length;
  const previousPrompt = session.prompt.text;
  bubble(chat, "learner", answer);
  session = respond(session, answer);

  if (session.feedback) bubble(chat, "tutor", session.feedback.text, session.feedback.tone);
  if (session.chunks.length > before) chat.appendChild(chunkVisual(session.chunks[session.chunks.length - 1]));

  const repeated = session.prompt.text === previousPrompt && session.feedback?.tone !== "correct";
  const last = repeated
    ? chat.lastElementChild
    : bubble(chat, "tutor", session.prompt.text, session.phase === "done" ? "final" : "question");
  panel.querySelector(".tally").textContent = tallyText(session);
  renderAnswerArea(area, session, chat);
  last.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
}

function start() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
  validationMessage.hidden = true;
  results.replaceChildren();
  results.hidden = true;

  try {
    session = createGuidedSession(readWholeNumber(dividendInput), readWholeNumber(divisorInput));
  } catch (error) {
    hidePanel();
    errorMessage.textContent = error.message;
    errorMessage.className = "message error";
    errorMessage.hidden = false;
    return;
  }

  const heading = el("h2", "", `Let’s work out ${session.dividend} ÷ ${session.divisor} together`);
  heading.id = "guided-heading";
  const tally = el("p", "tally", tallyText(session));
  const chat = el("div", "chat");
  chat.setAttribute("aria-live", "polite");
  const area = el("div", "answer-area");

  panel.replaceChildren(heading, tally, chat, area);
  panel.hidden = false;
  bubble(chat, "tutor", session.prompt.text, "question");
  renderAnswerArea(area, session, chat);
}

if (guidedButton && panel) {
  guidedButton.addEventListener("click", start);
  form.addEventListener("submit", hidePanel);
  resetButton.addEventListener("click", hidePanel);
}
