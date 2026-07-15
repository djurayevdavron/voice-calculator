// input (displey) va tugmalar olindi
const display = document.querySelector(".display input");
const buttons = document.querySelectorAll(".btn");

let justCalculated = false;

// ==========================================
// MATEMATIKA YADROSI (TOKENIZATOR, PARSER, VALIDATOR)
// ==========================================

// 1. Professional Tokenizator
function tokenize(exp) {
  let tokens = [];
  let numStr = "";
  for (let i = 0; i < exp.length; i++) {
    let char = exp[i];
    if (/[0-9\.]/.test(char)) {
      numStr += char;
    } else {
      if (numStr) {
        tokens.push({ type: "NUMBER", value: numStr });
        numStr = "";
      }
      if (char !== " ") tokens.push({ type: "CHAR", value: char });
    }
  }
  if (numStr) tokens.push({ type: "NUMBER", value: numStr });
  return tokens;
}

// 2. Yashirin ko'paytirishni qayta ishlash
function autoInsertMultiplication(tokens) {
  let result = [];
  for (let i = 0; i < tokens.length; i++) {
    let curr = tokens[i];
    result.push(curr);

    if (i < tokens.length - 1) {
      let next = tokens[i + 1];
      let currIsVal =
        curr.type === "NUMBER" || ["π", ")", "!", "%"].includes(curr.value);
      let nextIsVal =
        next.type === "NUMBER" || ["π", "(", "√"].includes(next.value);

      if (currIsVal && nextIsVal) {
        result.push({ type: "CHAR", value: "×" });
      }
    }
  }
  return result;
}

// 3. Qat'iy Token Validator
function validateTokens(tokens) {
  if (tokens.length === 0) return;
  let ops = ["+", "-", "×", "÷", "^"];

  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i].value;
    let prev = i > 0 ? tokens[i - 1].value : null;
    let next = i < tokens.length - 1 ? tokens[i + 1].value : null;

    // O'nlik kasr tokenini tekshirish
    if (tokens[i].type === "NUMBER" && t.split(".").length > 2)
      throw new SyntaxError();
    if (t === ".") throw new SyntaxError();

    // Boshlanish/Tugallanish holatini tekshirish
    if (i === 0 && ["×", "÷", "^", "%", "!", ")"].includes(t))
      throw new SyntaxError();
    if (
      i === tokens.length - 1 &&
      ["+", "-", "×", "÷", "^", "(", "√"].includes(t)
    )
      throw new SyntaxError();

    // Ketma-ket operatorlarni tekshirish (Faqat Unar minus ruxsat etilgan)
    if (ops.includes(t)) {
      if (prev && ops.includes(prev)) {
        if (t !== "-") throw new SyntaxError(); // Ikkinchi operator sifatida faqat minusga ruxsat etiladi
        if (t === "-" && (prev === "-" || prev === "+"))
          throw new SyntaxError(); // -- va +- bloklangan
      }
    }

    // Noto'g'ri maxsus ketma-ketliklar
    if (t === "(" && next === ")") throw new SyntaxError(); // Bo'sh qavslar
    if (t === "!" && next === "!") throw new SyntaxError(); // !! bloklangan
    if (t === "%" && next === "%") throw new SyntaxError(); // %% bloklangan
  }
}

// 4. Qavslar stegini tekshirish
function validateBracketsStack(exp) {
  let stack = 0;
  for (let char of exp) {
    if (char === "(") stack++;
    if (char === ")") stack--;
    if (stack < 0) return false;
  }
  return stack === 0;
}

// 5. Rekursiv tushuvchi parser (AST -> JS ifoda qatori)
function parseToRaw(tokens) {
  let pos = 0;

  // 1-qatlam: Qo'shish va Ayirish (+, -)
  function parseExpression() {
    let res = parseTerm();
    while (
      pos < tokens.length &&
      (tokens[pos].value === "+" || tokens[pos].value === "-")
    ) {
      let op = tokens[pos++].value;
      let right = parseTerm();
      res = `(${res} ${op} ${right})`;
    }
    return res;
  }

  // 2-qatlam: Ko'paytirish va Bo'lish (×, ÷)
  function parseTerm() {
    let res = parseUnary();
    while (
      pos < tokens.length &&
      (tokens[pos].value === "×" || tokens[pos].value === "÷")
    ) {
      let op = tokens[pos++].value === "×" ? "*" : "/";
      let right = parseUnary();
      res = `(${res} ${op} ${right})`;
    }
    return res;
  }

  // 3-qatlam: Unary amallar (Manfiy/Musbat ishora, Kvadrat ildiz)
  function parseUnary() {
    if (pos >= tokens.length) throw new SyntaxError();
    let token = tokens[pos];

    if (token.value === "-") {
      pos++;
      return `(-${parseUnary()})`;
    }
    if (token.value === "+") {
      pos++;
      return `(+${parseUnary()})`;
    }
    if (token.value === "√") {
      pos++;
      return `Math.sqrt(${parseUnary()})`;
    }

    return parseFactor();
  }

  // 4-qatlam: Daraja (^) - O'ngdan chapga (Right-associative) ishlaydi
  function parseFactor() {
    let res = parsePostfix();
    while (pos < tokens.length && tokens[pos].value === "^") {
      pos++;
      let right = parseUnary(); // 2^-3 kabi holatlar ishlashi uchun Unary ga qaytiladi
      res = `(${res} ** ${right})`;
    }
    return res;
  }

  // 5-qatlam: Postfix amallar (!, %)
  function parsePostfix() {
    let res = parsePrimary();
    while (
      pos < tokens.length &&
      (tokens[pos].value === "!" || tokens[pos].value === "%")
    ) {
      if (tokens[pos].value === "!") {
        res = `factorial(${res})`;
        pos++;
      } else if (tokens[pos].value === "%") {
        res = `(${res} * 0.01)`;
        pos++;
      }
    }
    return res;
  }

  // 6-qatlam: Asosiy elementlar (Sonlar, π, Qavslar)
  function parsePrimary() {
    if (pos >= tokens.length) throw new SyntaxError();
    let token = tokens[pos];

    let res = "";
    if (token.type === "NUMBER") {
      // Octal Bug Fix: Sakkizlik sanoq sistemasiga o'tib ketishining oldi olindi
      res = String(Number(token.value));
      pos++;
    } else if (token.value === "π") {
      res = "Math.PI";
      pos++;
    } else if (token.value === "(") {
      pos++;
      res = `(${parseExpression()})`;
      if (pos >= tokens.length || tokens[pos].value !== ")")
        throw new SyntaxError();
      pos++;
    } else {
      throw new SyntaxError(); // Kutilmagan token (masalan, noto'g'ri operator)
    }

    return res;
  }

  let rawString = parseExpression();
  if (pos < tokens.length) throw new SyntaxError();
  return rawString;
}

// 6. Professional toRaw o'rami
function toRaw(exp) {
  exp = exp.replace(/\*/g, "×").replace(/\//g, "÷").replace(/−/g, "-");
  let tokens = tokenize(exp);
  tokens = autoInsertMultiplication(tokens);
  validateTokens(tokens);
  return parseToRaw(tokens);
}

// Faktorial mantiqi
function factorial(n) {
  n = Number(n);
  if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error();
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// ==========================================
// KALKULYATOR INTERFEYSI VA MANTIQI
// ==========================================

function handleInput(value) {
  // Oldingi xato/natijalarni tozalash
  if (["Error", "NaN", "Infinity", "undefined"].includes(display.value)) {
    display.value = "";
  }

  // Kiritish uzunligini cheklash
  if (
    display.value.length >= 100 &&
    !["AC", "C", "⌫", "D", "="].includes(value)
  )
    return;

  value = value
    .replace(",", ".")
    .replace("−", "-")
    .replace("×", "*")
    .replace("÷", "/");
  let lastChar = display.value.slice(-1);

  // Tenglikdan so'ng yangi son kiritilsa, tozalash
  if (justCalculated) {
    if ("0123456789.()√π!C".includes(value)) {
      display.value = "";
      lastChar = "";
    }
    justCalculated = false;
  }

  // Buyruqlar
  if (value === "AC" || value === "C") {
    display.value = "";
    return;
  }
  if (value === "⌫" || value === "D") {
    display.value = display.value.slice(0, -1);
    return;
  }
  if (value === "=") {
    calculate();
    return;
  }

  // Dastlabki kiritish himoyasi
  if (!display.value && ["+", "*", "/", "^", "%", "!", ")"].includes(value))
    return;

  // Aqlli qavslarni boshqarish
  if (value === "()") {
    let open = (display.value.match(/\(/g) || []).length;
    let close = (display.value.match(/\)/g) || []).length;
    value = open > close && lastChar !== "(" ? ")" : "(";
  }

  let uiVal = value === "*" ? "×" : value === "/" ? "÷" : value;

  // Boshlang'ich nollarni professional normallashtirish
  if (/^\d$/.test(uiVal)) {
    const lastToken = display.value.match(/(^|[+\-×÷^%(√π!])0$/);

    if (lastToken) {
      if (uiVal === "0") {
        return;
      }

      display.value =
        display.value.substring(0, display.value.length - 1) + uiVal;

      return;
    }
  }

  let ops = ["+", "-", "×", "÷", "^"];

  // Interfeysda operatorlarni muammosiz boshqarish
  if (ops.includes(uiVal) && ops.includes(lastChar)) {
    if (uiVal === "-" && lastChar !== "-" && lastChar !== "+") {
      display.value += uiVal;
      return;
    } else {
      display.value = display.value.slice(0, -1) + uiVal;
      return;
    }
  }

  // Ikki marta nuqta qo'yilishining oldini olish
  if (uiVal === ".") {
    let parts = display.value.split(/[\+\-\×\÷\^\!\(\)√]/);
    if (parts[parts.length - 1].includes(".")) return;
    if (!/[0-9]/.test(lastChar)) uiVal = "0.";
  }

  // Asosiy interfeys ketma-ketligi filtrlari
  if (uiVal === "^" && lastChar === "^") return;
  if (uiVal === "%" && lastChar === "%") return;
  if (uiVal === "!" && lastChar === "!") return;
  if (uiVal === "√" && display.value.match(/√+$/)?.[0].length >= 2) return;

  display.value += uiVal;
}

buttons.forEach((btn) => {
  btn.addEventListener("click", () => handleInput(btn.innerText));
});

function calculate() {
  try {
    let exp = display.value;

    // Hisoblashdan oldin oxiridagi operator/nuqtalarni tozalash
    while (/[\+\-\×\÷\.\√\^]$/.test(exp)) {
      exp = exp.slice(0, -1);
    }

    if (!exp) {
      display.value = "";
      return;
    }

    if (!validateBracketsStack(exp)) throw new SyntaxError();

    let rawExp = toRaw(exp); // Parsing va Token validatsiyasi shu yerda bajariladi
    let result = new Function("factorial", "return " + rawExp)(factorial);

    // Barqaror ishlashi uchun global xatoliklarni ushlash
    if (!isFinite(result) || isNaN(result) || typeof result !== "number") {
      throw new Error();
    }

    result = Number.isInteger(result) ? result : parseFloat(result.toFixed(10));
    display.value = result;
    justCalculated = true;
  } catch (err) {
    display.value = "Error";
  }
}

// ==========================================
// KLAVIATURA MANTIQI
// ==========================================

document.addEventListener("keydown", (e) => {
  let key = e.key;
  if (key === ",") key = ".";
  if (key === "Enter" || key === "=") {
    e.preventDefault();
    calculate();
    return;
  }
  if (key === "Backspace") {
    handleInput("⌫");
    return;
  }
  if (key === "Escape") {
    handleInput("AC");
    return;
  }
  if ("0123456789+-*/.%()^!".includes(key)) {
    handleInput(key);
  }
});

// ==========================================
// TUNGI REJIM
// ==========================================

const toggleBtn = document.getElementById("toggleMode");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    localStorage.setItem("theme", "dark");
  } else {
    toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem("theme", "light");
  }
});

// ==========================================
// OVOZNI TANISH (SpeechRecognition API)
// ==========================================

const voiceBtn = document.getElementById("voiceBtn");
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let isListening = false;
let manualStop = false;

function parseVoice(text) {
  let speech = text.toLowerCase();

  const voiceDictionary = [
    [/\b(clear all|clear screen|clear|reset|erase all)\b/g, "C"],
    [/\b(backspace|undo|remove|delete)\b/g, "D"],
    [/\b(stop listening|halt)\b/g, "stop"],
    [/\b(dark mode|dark theme|enable dark|night mode)\b/g, "DARKMODE"],
    [/\b(light mode|light theme|disable dark|day mode)\b/g, "LIGHTMODE"],
    [/\b(toggle theme|switch theme|change theme)\b/g, "TOGGLEMODE"],
    [/\b(equals|equal|is|gives|makes|results in|gives us)\b/g, "="],
    [/\b(plus|add|at|addition|and|with)\b/g, "+"],
    [/\b(minus|subtract|subtraction|take away|less)\b/g, "-"],
    [/\b(times|multiply|multiplied by|product of|x)\b/g, "*"],
    [/\b(divide|divided by|division|over|out of)\b/g, "/"],
    [/\b(square root of|square root|sqrt|root)\b/g, "√"],
    [/\b(squared|square)\b/g, "^2"],
    [/\b(cubed|cube)\b/g, "^3"],
    [/\b(to the power of|raised to|power)\b/g, "^"],
    [/\b(percent|percentage|modulo|modulus)\b/g, "%"],
    [/\b(factorial|exclamation)\b/g, "!"],
    [/\b(open parenthesis|open bracket|bracket open)\b/g, "("],
    [/\b(close parenthesis|close bracket|bracket close)\b/g, ")"],
    [/\b(bracket|brackets|parenthesis)\b/g, "B"],
    [/\b(point|dot|decimal)\b/g, "."],
    [/\b(pi|pie|p)\b/g, "π"],
    [/\b(zero|oh|null)\b/g, "0"],
    [/\b(one|won)\b/g, "1"],
    [/\b(two|too|to)\b/g, "2"],
    [/\b(three|tree)\b/g, "3"],
    [/\b(four|for)\b/g, "4"],
    [/\b(five)\b/g, "5"],
    [/\b(six)\b/g, "6"],
    [/\b(seven)\b/g, "7"],
    [/\b(eight|ate)\b/g, "8"],
    [/\b(nine)\b/g, "9"],
    [/\b(ten)\b/g, "10"],
    [/\b(eleven)\b/g, "11"],
    [/\b(twelve)\b/g, "12"],
    [/\b(thirteen)\b/g, "13"],
    [/\b(fourteen)\b/g, "14"],
    [/\b(fifteen)\b/g, "15"],
    [/\b(sixteen)\b/g, "16"],
    [/\b(seventeen)\b/g, "17"],
    [/\b(eighteen)\b/g, "18"],
    [/\b(nineteen)\b/g, "19"],
    [/\b(twenty)\b/g, "20"],
    [/\b(thirty)\b/g, "30"],
    [/\b(forty)\b/g, "40"],
    [/\b(fifty)\b/g, "50"],
    [/\b(sixty)\b/g, "60"],
    [/\b(seventy)\b/g, "70"],
    [/\b(eighty)\b/g, "80"],
    [/\b(ninety)\b/g, "90"],
  ];

  for (let [regex, replacement] of voiceDictionary) {
    speech = speech.replace(regex, replacement);
  }
  return speech;
}

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  voiceBtn.addEventListener("click", () => {
    if (isListening) {
      manualStop = true;
      recognition.stop();
    } else {
      manualStop = false;
      recognition.start();
    }
  });

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.textContent = "🛑";
    voiceBtn.style.background = "#ff4d4d";
  };

  recognition.onend = () => {
    if (!manualStop) {
      try {
        recognition.start();
      } catch (e) {}
      return;
    }
    isListening = false;
    voiceBtn.textContent = "🎤";
    voiceBtn.style.background = "lightblue";
  };

  recognition.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "aborted") {
      manualStop = true;
    }
  };

  recognition.onresult = (event) => {
    let rawSpeech = event.results[event.resultIndex][0].transcript
      .trim()
      .toLowerCase();

    rawSpeech = rawSpeech.replace(/(\d)([a-z]+)/g, "$1 $2");
    rawSpeech = rawSpeech.replace(/([a-z]+)(\d)/g, "$1 $2");

    let parsedSpeech = parseVoice(rawSpeech);

    if (parsedSpeech.includes("stop")) {
      manualStop = true;
      recognition.stop();
      return;
    }

    if (parsedSpeech.includes("DARKMODE")) {
      document.body.classList.add("dark");
      toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem("theme", "dark");
      return;
    }

    if (parsedSpeech.includes("LIGHTMODE")) {
      document.body.classList.remove("dark");
      toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      localStorage.setItem("theme", "light");
      return;
    }

    if (parsedSpeech.includes("TOGGLEMODE")) {
      toggleBtn.click();
      return;
    }

    let expression = parsedSpeech.replace(/\s+/g, "");

    for (let char of expression) {
      if ("0123456789+-*/.()√π^!=%".includes(char)) {
        handleInput(char);
      } else if (char === "C") {
        handleInput("AC");
      } else if (char === "D") {
        handleInput("⌫");
      } else if (char === "B") {
        handleInput("()");
      }
    }
  };
}

// ==========================================
// MODAL OYNA MANTIQI
// ==========================================

const infoModal = document.getElementById("infoModal");
const infoBtn = document.getElementById("infoBtn");
const closeBtn = document.querySelector(".close-btn");

infoBtn.addEventListener("click", () => {
  infoModal.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
  infoModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === infoModal) {
    infoModal.style.display = "none";
  }
});
