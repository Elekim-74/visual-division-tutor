import test from "node:test";
import assert from "node:assert/strict";
import { calculateDivision, validateCalculation } from "../division.js";

class FakeElement {
  constructor(tagName, id = "") {
    this.tagName = tagName;
    this.id = id;
    this.children = [];
    this.dataset = {};
    this.hidden = false;
    this.className = "";
    this.textContent = "";
    this.value = "";
    this.listeners = {};
    this.reset = () => {};
    this.focus = () => {};
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.flat().forEach((child) => this.appendChild(child));
  }

  replaceChildren(...children) {
    this.children = [];
    this.append(...children);
  }

  setAttribute(name, value) {
    this.attributes = this.attributes ?? {};
    this.attributes[name] = String(value);
  }

  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }

  querySelectorAll(selector) {
    const matches = (node) => {
      if (selector === ".group-visual") return node.className === "group-visual";
      if (selector === ".group") return node.className === "group";
      if (selector === ".counter") return node.className.includes("counter");
      return false;
    };

    const found = [];
    const visit = (node) => {
      node.children.forEach((child) => {
        if (matches(child)) found.push(child);
        visit(child);
      });
    };
    visit(this);
    return found;
  }

  querySelector(selector) {
    if (selector === "#results") return this.id === "results" ? this : null;
    return null;
  }
}

const form = new FakeElement("form");
const dividendInput = new FakeElement("input");
const divisorInput = new FakeElement("input");
const errorMessage = new FakeElement("p");
const resetButton = new FakeElement("button");
const results = new FakeElement("section", "results");
const validationMessage = new FakeElement("p", "validation-message");

const elements = {
  "#division-form": form,
  "#dividend": dividendInput,
  "#divisor": divisorInput,
  "#error-message": errorMessage,
  "#reset-button": resetButton,
  "#results": results,
  "#validation-message": validationMessage,
};

form.reset = () => {
  dividendInput.value = "";
  divisorInput.value = "";
};

globalThis.document = {
  querySelector(selector) {
    return elements[selector];
  },
  createElement(tagName) {
    return new FakeElement(tagName);
  },
};

const { renderCalculation, validateRenderedGroups } = await import("../app.js");

function renderAndInspect(dividend, divisor) {
  const calculation = calculateDivision(dividend, divisor);
  assert.equal(validateCalculation(calculation).valid, true);
  assert.equal(renderCalculation(calculation), true);

  const visualChunks = results.querySelectorAll(".group-visual");
  assert.equal(visualChunks.length, calculation.chunks.length);

  return {
    calculation,
    visualChunks,
    groups: visualChunks.flatMap((visual) => visual.querySelectorAll(".group")),
  };
}

const visualCases = [
  [50, 5, 10, 5],
  [280, 14, 20, 14],
  [40, 8, 5, 8],
  [28, 14, 2, 14],
  [8, 8, 1, 8],
];

for (const [dividend, divisor, expectedGroups, expectedCounters] of visualCases) {
  test(`${expectedGroups} groups of ${expectedCounters} render as exact separate groups`, () => {
    const { groups } = renderAndInspect(dividend, divisor);

    assert.equal(groups.length, expectedGroups);
    for (const group of groups) {
      assert.equal(group.dataset.groupSize, String(expectedCounters));
      assert.equal(group.querySelectorAll(".counter").length, expectedCounters);
    }
    assert.equal(validateRenderedGroups(results), true);
  });
}

test("20-group teaching cue is shown without replacing the groups", () => {
  const { visualChunks, groups } = renderAndInspect(280, 14);

  assert.equal(groups.length, 20);
  const cue = visualChunks[0].children.find((child) => child.className === "group-cue");
  assert.equal(cue.textContent, "10 groups + another 10 groups = 20 groups");
});

test("partial quotients are combined before the final answer", () => {
  renderAndInspect(85, 3);

  const finalCard = results.children.at(-1);
  const summary = finalCard.children.find((child) => child.className === "quotient-summary");
  const explanation = finalCard.children.find((child) => child.className === "quotient-explanation");

  assert.equal(summary.textContent, "Putting it together: 20 + 5 + 2 + 1 = 28 groups.");
  assert.equal(explanation.textContent, "We made 28 equal groups of 3, with 1 left over.");
});

test("a remainder of 1 uses singular visible and accessible wording", () => {
  renderAndInspect(85, 3);

  const finalStep = results.children.at(-3);
  const leftAmount = finalStep.children.find((child) => child.className === "left-amount");
  const remainderCard = results.children.at(-2);
  const visualRow = remainderCard.children.find((child) => child.className.includes("remainder-row"));
  const remainderLabel = remainderCard.children.find((child) => child.className === "remainder-label");

  assert.equal(leftAmount.textContent, "Now 1 counter is left.");
  assert.equal(remainderLabel.textContent, "1 counter is left over, so the remainder is 1.");
  assert.equal(visualRow.children[0].attributes["aria-label"], "1 counter is left over");
});

test("a remainder greater than 1 uses plural visible and accessible wording", () => {
  renderAndInspect(47, 4);

  const finalStep = results.children.at(-3);
  const leftAmount = finalStep.children.find((child) => child.className === "left-amount");
  const remainderCard = results.children.at(-2);
  const visualRow = remainderCard.children.find((child) => child.className.includes("remainder-row"));
  const remainderLabel = remainderCard.children.find((child) => child.className === "remainder-label");

  assert.equal(leftAmount.textContent, "Now 3 counters are left.");
  assert.equal(remainderLabel.textContent, "3 counters are left over, so the remainder is 3.");
  assert.equal(visualRow.children[0].attributes["aria-label"], "3 counters are left over");
});

test("a zero quotient explains why every counter is left over", () => {
  renderAndInspect(3, 5);

  const remainderCard = results.children.at(-2);
  const remainderLabel = remainderCard.children.find((child) => child.className === "remainder-label");
  const finalCard = results.children.at(-1);
  const explanation = finalCard.children.find((child) => child.className === "quotient-explanation");

  assert.equal(
    remainderLabel.textContent,
    "3 is too small to make even one group of 5, so all 3 are left over.",
  );
  assert.equal(explanation.textContent, "We made 0 equal groups of 5, with 3 left over.");
});

test("responsive viewport changes do not change group or counter counts", () => {
  for (const width of [320, 768, 1440]) {
    document.documentElement = { clientWidth: width };
    const { groups } = renderAndInspect(280, 14);
    assert.equal(groups.length, 20);
    assert.deepEqual(
      groups.map((group) => group.querySelectorAll(".counter").length),
      Array(20).fill(14),
    );
  }
});

test("reset still clears inputs and rendered results", () => {
  renderAndInspect(50, 5);
  dividendInput.value = "50";
  divisorInput.value = "5";

  resetButton.listeners.click();

  assert.equal(dividendInput.value, "");
  assert.equal(divisorInput.value, "");
  assert.equal(results.hidden, true);
  assert.equal(results.children.length, 0);
});

test("visual validation still hides a chunk with the wrong group count", () => {
  const { visualChunks } = renderAndInspect(50, 5);
  visualChunks[0].children.find((child) => child.className === "group-list").children.pop();

  assert.equal(validateRenderedGroups(results), false);
  assert.equal(results.hidden, true);
  assert.equal(validationMessage.textContent, "Visual validation error — incorrect group detected.");
});
