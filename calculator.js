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

function evaluateExpression(input) {
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

module.exports = { evaluateExpression, formatNumber };
