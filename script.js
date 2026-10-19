"use strict";

const expressionDisplay = document.querySelector("#expression");
const resultDisplay = document.querySelector("#result");
const feedbackDisplay = document.querySelector("#feedback");
const historyList = document.querySelector("#history-list");
const keypad = document.querySelector(".keypad");
const history = [];

let expression = "";
let lastResult = null;
let justCalculated = false;

function tokenize(input) {
  const tokens = [];
  let index = 0;

  while (index < input.length) {
    const character = input[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(character)) {
      const start = index;
      let decimalPoints = 0;
      while (index < input.length && /[0-9.]/.test(input[index])) {
        if (input[index] === ".") decimalPoints += 1;
        index += 1;
      }
      const value = input.slice(start, index);
      if (decimalPoints > 1 || value === ".") {
        throw new Error("Check the number format.");
      }
      tokens.push({ type: "number", value: Number(value) });
      continue;
    }

    if ("+-×÷()%".includes(character)) {
      tokens.push({ type: "operator", value: character });
      index += 1;
      continue;
    }

    throw new Error("That character isn't supported.");
  }

  return tokens;
}

function parseExpression(input) {
  const tokens = tokenize(input);
  let position = 0;

  function peek(value) {
    return tokens[position]?.value === value;
  }

  function parsePrimary() {
    if (peek("+") || peek("-")) {
      const sign = tokens[position].value;
      position += 1;
      const value = parsePrimary();
      return sign === "-" ? -value : value;
    }

    if (peek("(")) {
      position += 1;
      const value = parseAddition();
      if (!peek(")")) throw new Error("Add a closing parenthesis.");
      position += 1;
      return value;
    }

    const token = tokens[position];
    if (token?.type !== "number") throw new Error("Enter a number.");
    position += 1;
    return token.value;
  }

  function parsePostfix() {
    let value = parsePrimary();
    while (peek("%")) {
      value /= 100;
      position += 1;
    }
    return value;
  }

  function parseMultiplication() {
    let value = parsePostfix();
    while (peek("×") || peek("÷")) {
      const operator = tokens[position].value;
      position += 1;
      const right = parsePostfix();
      if (operator === "÷" && right === 0) throw new Error("Cannot divide by zero.");
      value = operator === "×" ? value * right : value / right;
    }
    return value;
  }

  function parseAddition() {
    let value = parseMultiplication();
    while (peek("+") || peek("-")) {
      const operator = tokens[position].value;
      position += 1;
      const right = parseMultiplication();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  if (tokens.length === 0) throw new Error("Enter a calculation.");
  const value = parseAddition();
  if (position < tokens.length) throw new Error("Check the expression.");
  if (!Number.isFinite(value)) throw new Error("The result is too large.");
  return value;
}

function formatNumber(value) {
  if (Object.is(value, -0)) return "0";
  return Number(value.toPrecision(12)).toString();
}

function render() {
  expressionDisplay.textContent = expression;
  if (lastResult === null) {
    resultDisplay.textContent = expression ? "" : "0";
  } else {
    resultDisplay.textContent = formatNumber(lastResult);
  }
}

function setFeedback(message, kind = "") {
  feedbackDisplay.textContent = message;
  if (kind) feedbackDisplay.dataset.kind = kind;
  else delete feedbackDisplay.dataset.kind;
}

function appendValue(value) {
  if (justCalculated) {
    expression = /[0-9.(]/.test(value) ? "" : formatNumber(lastResult);
    lastResult = null;
  }

  expression += value;
  justCalculated = false;
  setFeedback("");
  render();
}

function clear() {
  expression = "";
  lastResult = null;
  justCalculated = false;
  setFeedback("");
  render();
}

function deleteLast() {
  expression = expression.slice(0, -1);
  lastResult = null;
  justCalculated = false;
  setFeedback("");
  render();
}

function addHistory(input, value) {
  history.unshift({ expression: input, result: formatNumber(value) });
  history.splice(8);
  historyList.replaceChildren();

  for (const entry of history) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const expressionText = document.createElement("span");
    const resultText = document.createElement("span");

    button.type = "button";
    button.className = "history-entry";
    button.setAttribute("aria-label", `${entry.expression} equals ${entry.result}`);
    expressionText.className = "history-expression";
    expressionText.textContent = entry.expression;
    resultText.className = "history-result";
    resultText.textContent = entry.result;
    button.append(expressionText, resultText);
    button.addEventListener("click", () => {
      expression = entry.expression;
      lastResult = Number(entry.result);
      justCalculated = true;
      setFeedback("");
      render();
    });
    item.append(button);
    historyList.append(item);
  }
}

function calculate() {
  try {
    const input = expression;
    const value = parseExpression(input);
    lastResult = value;
    expressionDisplay.textContent = `${input} =`;
    resultDisplay.textContent = formatNumber(value);
    justCalculated = true;
    addHistory(input, value);
    setFeedback("");
  } catch (error) {
    setFeedback(error.message, "error");
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "clear") clear();
  else if (button.dataset.action === "delete") deleteLast();
  else if (button.dataset.action === "equals") calculate();
  else if (button.dataset.value) appendValue(button.dataset.value);
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target instanceof Element && event.target.closest("button, input, textarea, select, [contenteditable='true']")) return;

  if (/^[0-9.]$/.test(event.key)) appendValue(event.key);
  else if (["+", "-", "%", "(", ")"].includes(event.key)) appendValue(event.key);
  else if (event.key === "*") appendValue("×");
  else if (event.key === "/") appendValue("÷");
  else if (event.key === "Enter" || event.key === "=") calculate();
  else if (event.key === "Backspace") deleteLast();
  else if (event.key === "Escape" || event.key === "Delete") clear();
  else return;

  event.preventDefault();
});

document.querySelector("#copy-result").addEventListener("click", async () => {
  if (lastResult === null) {
    setFeedback("Calculate something first.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(formatNumber(lastResult));
    setFeedback("Result copied.");
  } catch (error) {
    setFeedback("Couldn't copy the result. Check clipboard permissions.", "error");
  }
});

document.querySelector("#clear-history").addEventListener("click", () => {
  history.length = 0;
  historyList.replaceChildren();
  const emptyMessage = document.createElement("li");
  emptyMessage.className = "history-empty";
  emptyMessage.textContent = "Your calculations will show up here.";
  historyList.append(emptyMessage);
});
