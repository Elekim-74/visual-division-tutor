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
