/// input (display) va tugmalar olindi
const display = document.querySelector(".display input");
const buttons = document.querySelectorAll(".btn");

const operators = "+-*/";
const uiOperators = ["+", "−", "×", "÷", "^"];
let justCalculated = false;

// Faktorial hisoblash
function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// JS dagi belgilarni chiroyli UI ko'rinishga o'tkazish
function toUI(val) {
  return val
    .replace(/\*\*/g, "^")
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/\-/g, "−")
    .replace(/Math\.PI/g, "π")
    .replace(/Math\.sqrt\(([^)]+)\)/g, "√$1");
}

// UI dagi ifodani hisoblash uchun JS (Raw) tiliga o'girish
function toRaw(val) {
  return (
    val
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/\^/g, "**")
      // Yashirin ko'paytirish (Masalan: 2π -> 2*π, 2(3) -> 2*(3))
      .replace(/(\d+)(π)/g, "$1*$2")
      .replace(/(\d+)(√)/g, "$1*$2")
      .replace(/(\d+)(\()/g, "$1*$2")
      .replace(/(\))(\d+)/g, "$1*$2")
      .replace(/(\))(\()/g, "$1*$2")
      .replace(/π/g, "Math.PI")
      .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)")
      .replace(/√(\d+(\.\d+)?)/g, "Math.sqrt($1)")
      .replace(/%/g, "*0.01") // Foizni hisoblashning eng xavfsiz usuli
      .replace(/(\d+)!/g, "factorial($1)")
  );
}

// Asosiy kiritish funksiyasi
function handleInput(value) {
  if (
    display.value === "Error" ||
    display.value === "NaN" ||
    display.value === "Infinity"
  ) {
    display.value = "";
  }

  value = value
    .replace(",", ".")
    .replace("−", "-")
    .replace("×", "*")
    .replace("÷", "/");
  let raw = toRaw(display.value);
  let lastChar = raw.slice(-1);

  // Tenglikdan keyin yangi son kelsa ekranni tozalash, lekin OPERATOR kelsa davom ettirish
  if (justCalculated) {
    if ("0123456789.()√π!C".includes(value)) {
      display.value = "";
    }
    justCalculated = false;
  }

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

  // Aqlli Qavslar (Ham klaviatura tugmasi, ham ovoz uchun ishladi)
  if (value === "()") {
    let openCount = (display.value.match(/\(/g) || []).length;
    let closeCount = (display.value.match(/\)/g) || []).length;
    value = openCount > closeCount ? ")" : "(";
  }

  // Bitta sondagi ortiqcha nuqtani taqiqlash
  if (value === ".") {
    let parts = display.value.split(/[\+\-\*\/\^\!\(\)]/);
    if (parts[parts.length - 1].includes(".")) return;
  }

  // Ketma-ket operator yozilishini to'g'rilash
  if (
    operators.includes(value) &&
    operators.includes(lastChar) &&
    value !== "-"
  ) {
    raw = raw.slice(0, -1) + value;
    display.value = toUI(raw);
    return;
  }

  if (display.value === "0" && "0123456789(√π".includes(value)) {
    display.value = value;
  }
  // Operator yoki qavsdan keyin yozilgan ortiqcha 0 ni almashtirish
  if (/^[0-9]$/.test(value) && /(^|[+\-×÷*/^(])0$/.test(display.value)) {
    display.value = display.value.slice(0, -1) + value;
    return;
  } else {
    display.value += value;
  }

  display.value = toUI(display.value);
}

// UI tugmalari
buttons.forEach((btn) => {
  btn.addEventListener("click", () => handleInput(btn.innerText));
});

// Hisoblash funksiyasi
function calculate() {
  try {
    let exp = toRaw(display.value);

    // Ifodaning oxirida qolib ketgan chala operatorlarni olib tashlash
    while (/[\+\-\*\/\.\√\^]$/.test(exp)) {
      exp = exp.slice(0, -1);
    }

    if (!exp) {
      display.value = "";
      return;
    }

    let result = new Function("factorial", "return " + exp)(factorial);

    if (!isFinite(result) || isNaN(result)) {
      display.value = "Error";
      return;
    }

    result = Number.isInteger(result) ? result : parseFloat(result.toFixed(10));
    display.value = result;
    justCalculated = true;
  } catch (err) {
    display.value = "Error";
  }
}

// Klaviatura mantiqi
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

// Tema (Dark Mode) o'zgartirish
const toggleBtn = document.getElementById("toggleMode");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  toggleBtn.textContent = "☀️";
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    toggleBtn.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    toggleBtn.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

// ==== Ovoz bilan ishlash (Super AI Voice) ====
const voiceBtn = document.getElementById("voiceBtn");
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let isListening = false;
let manualStop = false;

function parseVoice(text) {
  let speech = text.toLowerCase();

  const voiceDictionary = [
    // Buyruqlar
    [/\b(clear all|clear screen|clear|reset|erase all)\b/g, "C"],
    [/\b(backspace|undo|remove|delete)\b/g, "D"],
    [/\b(stop listening|halt)\b/g, "stop"],

    // Tenglik amallari
    [/\b(equals|equal|is|gives|makes|results in|gives us)\b/g, "="],

    // Asosiy operatorlar
    [/\b(plus|add|at|addition|and|with)\b/g, "+"],
    [/\b(minus|subtract|subtraction|take away|less)\b/g, "-"],
    [/\b(times|multiply|multiplied by|product of|x)\b/g, "*"],
    [/\b(divide|divided by|division|over|out of)\b/g, "/"],

    // Maxsus amallar (TARTIB TO'G'RILANDI)
    [/\b(square root of|square root|sqrt|root)\b/g, "√"], // <- Ildiz birinchi tekshiriladi
    [/\b(squared|square)\b/g, "^2"], // <- Oddiy kvadrat undan keyin
    [/\b(cubed|cube)\b/g, "^3"],
    [/\b(to the power of|raised to|power)\b/g, "^"],
    [/\b(percent|percentage|modulo|modulus)\b/g, "%"],
    [/\b(factorial|exclamation)\b/g, "!"],

    // Qavslar va Kasr
    [/\b(open parenthesis|open bracket|bracket open)\b/g, "("],
    [/\b(close parenthesis|close bracket|bracket close)\b/g, ")"],
    [/\b(bracket|brackets|parenthesis)\b/g, "B"],
    [/\b(point|dot|decimal)\b/g, "."],

    // O'zgarmaslar
    [/\b(pi|pie|p)\b/g, "π"],

    // Sonlar
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

    // Yopishib qolgan son va harflarni majburan ajratish (Masalan: "2p" yoki "2times" -> "2 p")
    rawSpeech = rawSpeech.replace(/(\d)([a-z]+)/g, "$1 $2");
    rawSpeech = rawSpeech.replace(/([a-z]+)(\d)/g, "$1 $2");

    let parsedSpeech = parseVoice(rawSpeech);

    if (parsedSpeech.includes("stop")) {
      manualStop = true;
      recognition.stop();
      return;
    }

    let expression = parsedSpeech.replace(/\s+/g, "");

    for (let char of expression) {
      // % belgisiga ham ruxsat berildi!
      if ("0123456789+-*/.()√π^!=%".includes(char)) {
        handleInput(char);
      } else if (char === "C") {
        handleInput("AC");
      } else if (char === "D") {
        handleInput("⌫");
      } else if (char === "B") {
        // Aqlli qavsni ishga tushirish
        handleInput("()");
      }
    }
  };
}
// ==== Instruksiya (Modal) mantiqi ====
const infoModal = document.getElementById("infoModal");
const infoBtn = document.getElementById("infoBtn");
const closeBtn = document.querySelector(".close-btn");

// Info tugmasi bosilganda oynani ko'rsatish
infoBtn.addEventListener("click", () => {
  infoModal.style.display = "flex";
});

// X tugmasi bosilganda yopish
closeBtn.addEventListener("click", () => {
  infoModal.style.display = "none";
});

// Oynadan tashqariga (qorong'u fonga) bosilganda yopish
window.addEventListener("click", (event) => {
  if (event.target === infoModal) {
    infoModal.style.display = "none";
  }
});
