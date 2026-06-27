/// input (display) olindi
const display = document.querySelector(".display input");

/// barcha tugmalar olindi
const buttons = document.querySelectorAll(".btn");

/// JS uchun operatorlar belgilandi
const operators = "+-*/";

// /foydalanuvchi ko‘radigan operatorlar belgilandi
const uiOperators = ["+", "−", "×", "÷", "^"];

//// display dagi qiymat JS formatga o'tkazildi
function toRaw(val) {
    return val
        .replace(/×/g, "*")   /// ko'paytirish belgisi almashtirildi
        .replace(/÷/g, "/")   // bo'lish belgisi almashtirildi
        .replace(/−/g, "-")   /// ayirish belgisi almashtirildi
        .replace(/\^/g, "**"); /// daraja belgisi o'zgartirildi
}
///// JS natija chiroyli ko'rinishga o'tkazildi
function toUI(val) {
    return val
        .replace(/\*\*/g, "^")
        .replace(/\*/g, "×")
        .replace(/\//g, "÷")
        .replace(/\-/g, "−");
}
/////// har bir tugmaga hodisa biriktirildi
buttons.forEach(btn => {
    btn.addEventListener("click", () => {

        /// tugma qiymati olindi
        let value = btn.innerText;

        /// oxirgi belgi tekshirildi
        let lastUI = display.value.slice(-1);

        // ketma-ket operator yozilishi oldi olindi
        if (uiOperators.includes(lastUI) && uiOperators.includes(value)) {
            display.value = display.value.slice(0, -1) + value;
            return;
        }
        /// qiymat JS formatga moslashtirildi
        value = value
            .replace(",", ".")
            .replace("−", "-")
            .replace("×", "*")
            .replace("÷", "/");
        ///// display qiymati qayta olindi
        let raw = toRaw(display.value);
        let lastChar = raw.slice(-1);
        //// operatorlar ketma-ket yozilishi oldi olindi
        if (operators.includes(value) && operators.includes(lastChar)) {
            raw = raw.slice(0, -1) + value;
            display.value = toUI(raw);
            return;
        }
        /// barcha qiymatlar tozalandi
        if (value === "AC") {
            display.value = "";
            return;
        }
        /// oxirgi belgi o'chirildi
        if (value === "⌫") {
            display.value = display.value.slice(0, -1);
            return;
        }
        //// hisoblash funksiyasi chaqirildi
        if (value === "=") {
            calculate();
            return;
        }
        /// foiz hisoblandi
        if (value === "%") {
            try {
                display.value = eval(toRaw(display.value)) / 100;
            } catch {
                display.value = "Error";
            }
            return;
        }
        //// qavslar soni tekshirildi
        if (value === "()") {
            let open = (display.value.match(/\(/g) || []).length;
            let close = (display.value.match(/\)/g) || []).length;

            //// kerakli qavs qo'shildi
            display.value += (open > close) ? ")" : "(";
            return;
        }
        //// ildiz chiqarildi
        if (value === "√") {
            try {
                display.value = Math.sqrt(eval(toRaw(display.value)));
            } catch {
                display.value = "Error";
            }
            return;
        }
        //// pi qiymati qo'shildi
        if (value === "π") {
            display.value += Math.PI;
            return;
        }
        /// daraja belgisi qo'shildi
        if (btn.innerText === "^") {
            let lastUI = display.value.slice(-1);
            ///// noto'g'ri holatlar oldi olindi
            if (lastUI === "^") return;
            if (operators.includes(lastChar)) return;

            display.value += "^";
            return;
        }
        //// faktorial hisoblandi
        if (value === "!") {
            try {
                let num = eval(toRaw(display.value));

                if (num >= 0) {
                    let res = 1;

                    // 1 dan n gacha ko'paytirildi
                    for (let i = 1; i <= num; i++) {
                        res *= i;
                    }

                    display.value = res;
                } else {
                    display.value = "Error";
                }

            } catch {
                display.value = "Error";
            }
            return;
        }

        //// 0 o'rniga yangi son yozildi
        if (display.value === "0" && "0123456789".includes(value)) {
            display.value = value;
        } 
        else if (value === ".") {
            let parts = raw.split(/[\+\-\*\/]/);
            let lastPart = parts[parts.length - 1];

            /// faqat bitta nuqta yozilishiga ruxsat berildi
            if (!lastPart.includes(".")) {
                display.value += ".";
            }
        } 
        /// oddiy qo'shish amalga oshirildi
        else {
            display.value += value;
        }
        /// natija UI ko'rinishga o'tkazildi
        display.value = toUI(display.value);
    });
});

/// hisoblash funksiyasi yaratildi
function calculate() {
    try {
        let exp = toRaw(display.value);
        //// oxirgi noto'g'ri belgi olib tashlandi
        if (/[\+\-\*\/\.]$/.test(exp)) {
            exp = exp.slice(0, -1);
        }
        //// natija hisoblandi
        display.value = eval(exp);
    } catch {
        display.value = "Error";
    }
}
//// klaviatura hodisasi qo'shildi
document.addEventListener("keydown", (e) => {
    let key = e.key;
    //// vergul nuqtaga almashtirildi
    if (key === ",") key = ".";
    let raw = toRaw(display.value);
    let lastChar = raw.slice(-1);
    //// ruxsat etilgan belgilar tekshirildi
    if ("0123456789+-*/.%()^".includes(key)) {
        let lastUI = display.value.slice(-1);
        /// operatorlar ketma-ket yozilishi oldi olindi
        if (uiOperators.includes(lastUI) && uiOperators.includes(key)) {
            display.value = display.value.slice(0, -1) + key;
            return;
        }
        if (operators.includes(key) && operators.includes(lastChar)) {
            raw = raw.slice(0, -1) + key;
            display.value = toUI(raw);
            return;
        }
        //// daraja belgisi qo'shildi
        if (key === "^") {
            if (lastUI === "^") return;
            display.value += "^";
            return;
        }
        //// sonlar yozildi
        if (display.value === "0" && "0123456789".includes(key)) {
            display.value = key;
        } 
        else if (key === ".") {
            let parts = raw.split(/[\+\-\*\/]/);
            let lastPart = parts[parts.length - 1];

            if (!lastPart.includes(".")) {
                display.value += ".";
            }
        } 
        else {
            display.value += key;
        }
    }
    //// Enter bosilganda hisoblandi
    if (key === "Enter") {
        e.preventDefault();
        calculate();
    }
    if (key === "=") calculate();

    /// backspace ishlatildi
    if (key === "Backspace") {
        display.value = display.value.slice(0, -1);
    }
    /// ESC bosilganda tozalandi
    if (key === "Escape") {
        display.value = "";
    }
    //// natija UI ko'rinishga o'tkazildi
    display.value = toUI(display.value);
});

//// dark mode tugmasi olindi
const toggleBtn = document.getElementById("toggleMode");
/// oldingi tema tekshirildi
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️";
}
/// tugma bosilganda tema o'zgartirildi
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
/// voice tugmasi olindi
const voiceBtn = document.getElementById("voiceBtn");
/// speech recognition aniqlandi
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    // tugma bosilganda yozuv boshlandi
    voiceBtn.addEventListener("click", () => {
        recognition.start();
    });
    /// ovoz natijasi olindi
    recognition.onresult = (event) => {
        let speech = event.results[0][0].transcript.toLowerCase();
        /// so'zlar raqam va operatorga o'zgartirildi
        speech = speech
            .replace(/one/g, "1")
            .replace(/two/g, "2")
            .replace(/three/g, "3")
            .replace(/four/g, "4")
            .replace(/five/g, "5")
            .replace(/six/g, "6")
            .replace(/seven/g, "7")
            .replace(/eight/g, "8")
            .replace(/nine/g, "9")
            .replace(/zero/g, "0")
            .replace(/plus/g, "+")
            .replace(/minus/g, "-")
            .replace(/times|multiply/g, "*")
            .replace(/divide/g, "/");
        //// natija display ga yozildi
        display.value = speech;
        setTimeout(calculate, 1000);
        //// hisoblash amalga oshirildi
        calculate();
    };
}
