// ---------- DOM references ----------
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");

// ---------- Bot memory (remembers the user's name) ----------
let userName = null;

// ---------- Helper: current time (HH:MM) ----------
function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ---------- Helper: pick a random item from an array ----------
function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ---------- Create and append a message element ----------
function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.classList.add("message", type);      // type = "sent" or "received"

  const textNode = document.createElement("span");
  textNode.textContent = text;             // textContent prevents HTML injection

  const time = document.createElement("span");
  time.classList.add("time");
  time.textContent = getTime();

  msg.appendChild(textNode);
  msg.appendChild(time);
  chatMessages.appendChild(msg);

  chatMessages.scrollTop = chatMessages.scrollHeight;   // auto-scroll
}

// ---------- 1. Maths: "what is 12 * 4", "25 plus 17", "square root of 81" ----------
function tryMath(text) {
  let t = text.toLowerCase();

  // square root
  const sq = t.match(/(?:square root of|sqrt of|sqrt)\s*(-?\d+(?:\.\d+)?)/);
  if (sq) {
    const n = parseFloat(sq[1]);
    if (n < 0) return "I can't take the square root of a negative number.";
    return "The square root of " + n + " is " + round(Math.sqrt(n)) + ".";
  }

  // convert words to symbols
  t = t
    .replace(/multiplied by|times|into/g, "*")
    .replace(/divided by|over/g, "/")
    .replace(/plus/g, "+")
    .replace(/minus/g, "-")
    .replace(/(\d)\s*x\s*(\d)/g, "$1*$2")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");

  const m = t.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/%^])\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;

  const a = parseFloat(m[1]);
  const op = m[2];
  const b = parseFloat(m[3]);
  let result;

  switch (op) {
    case "+": result = a + b; break;
    case "-": result = a - b; break;
    case "*": result = a * b; break;
    case "/":
      if (b === 0) return "I can't divide by zero.";
      result = a / b;
      break;
    case "%": result = a % b; break;
    case "^": result = Math.pow(a, b); break;
  }
  return a + " " + op + " " + b + " = " + round(result);
}

function round(n) {
  return Math.round(n * 1000000) / 1000000;
}

// ---------- 2. Remember the user's name ----------
function tryName(text) {
  // "my name is Rahul", "call me Rahul"
  const m = text.match(/(?:my name is|call me|i am called)\s+([a-zA-Z]+)/i);
  if (m) {
    userName = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    return "Nice to meet you, " + userName + "! How can I help you?";
  }
  if (/what('?s| is) my name|do you know my name|who am i/i.test(text)) {
    return userName
      ? "Your name is " + userName + "."
      : "I don't know your name yet. Tell me by saying \"My name is ...\".";
  }
  return null;
}

// ---------- 3. Keyword rules (checked in order) ----------
const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "Why did the developer go broke? Because he used up all his cache.",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
  "A SQL query walks into a bar, goes up to two tables and asks: \"Can I join you?\""
];

const rules = [
  {
    test: /\b(hello|hi|hey|hii|namaste)\b|good (morning|afternoon|evening)/,
    reply: function () {
      const who = userName ? ", " + userName : "";
      return pick([
        "Hello" + who + "! How can I help you today?",
        "Hi" + who + "! What would you like to talk about?"
      ]);
    }
  },
  {
    test: /how are you|how('?s| is) it going|how do you do/,
    reply: function () {
      return "I'm doing great, thanks for asking! How are you?";
    }
  },
  {
    test: /\bi('?m| am) (fine|good|great|okay|ok|well|happy)\b/,
    reply: function () {
      return "Glad to hear that! What would you like to do?";
    }
  },
  {
    test: /\bi('?m| am) (sad|tired|bored|upset|stressed|angry)\b/,
    reply: function () {
      return "Sorry to hear that. Maybe a joke will help - just ask me for one!";
    }
  },
  {
    test: /your name|who are you|what are you/,
    reply: function () {
      return "I'm Support Bot, a simple chatbot built with HTML, CSS and JavaScript for a web design lab.";
    }
  },
  {
    test: /what can you do|\bhelp\b|\bcommands?\b/,
    reply: function () {
      return "I can help with:\n" +
        "- Maths (e.g. 25 * 4, 100 / 8, square root of 81)\n" +
        "- Current time and date\n" +
        "- Jokes\n" +
        "- Basic web topics (HTML, CSS, JavaScript, DOM, events, closures, media queries)\n" +
        "- Remembering your name (say \"My name is ...\")";
    }
  },
  {
    test: /\btime\b/,
    reply: function () {
      return "The current time is " + new Date().toLocaleTimeString() + ".";
    }
  },
  {
    test: /\bdate\b|what day|today'?s day|\bday is it\b/,
    reply: function () {
      return "Today is " + new Date().toLocaleDateString([], {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      }) + ".";
    }
  },
  {
    test: /\bjokes?\b|make me laugh|funny/,
    reply: function () {
      return pick(jokes);
    }
  },
  {
    test: /\bweather\b/,
    reply: function () {
      return "I can't check live weather because I'm not connected to a weather service. A weather app or website will give you accurate details.";
    }
  },

  // ---- Topics related to this experiment ----
  {
    test: /\bhtml\b/,
    reply: function () {
      return "HTML (HyperText Markup Language) defines the structure of a web page using elements like <div>, <form>, <input> and <button>.";
    }
  },
  {
    test: /\bcss\b/,
    reply: function () {
      return "CSS (Cascading Style Sheets) controls the look of a page: colours, fonts, spacing and layout. Flexbox, Grid and media queries are used for responsive design.";
    }
  },
  {
    test: /javascript|\bjs\b/,
    reply: function () {
      return "JavaScript adds behaviour to a web page. It can handle events, change the DOM, validate forms and talk to servers.";
    }
  },
  {
    test: /\bdom\b|document object model/,
    reply: function () {
      return "The DOM (Document Object Model) is a tree representation of the page. JavaScript can read and change it using methods like getElementById(), createElement() and appendChild().";
    }
  },
  {
    test: /\bevents?\b|event handling|addeventlistener/,
    reply: function () {
      return "An event is an action such as a click, keypress or form submit. In JavaScript you handle it with element.addEventListener(\"click\", function).";
    }
  },
  {
    test: /closures?/,
    reply: function () {
      return "A closure is a function that remembers the variables from the place where it was created, even after that outer function has finished running.";
    }
  },
  {
    test: /\bscope\b/,
    reply: function () {
      return "Scope decides where a variable can be accessed. JavaScript has global scope, function scope and block scope (let and const).";
    }
  },
  {
    test: /media quer(y|ies)/,
    reply: function () {
      return "A media query applies CSS only when a condition is true, for example @media (max-width: 600px) { ... } targets mobile screens.";
    }
  },
  {
    test: /responsive/,
    reply: function () {
      return "Responsive design makes a website adapt to any screen size using flexible layouts, relative units, the viewport meta tag and CSS media queries.";
    }
  },
  {
    test: /\bfunctions?\b/,
    reply: function () {
      return "A function is a reusable block of code. Example: function add(a, b) { return a + b; }";
    }
  },
  {
    test: /thank(s| you)|\bthx\b/,
    reply: function () {
      return pick(["You're welcome!", "Happy to help!", "Anytime!"]);
    }
  },
  {
    test: /\bbye\b|goodbye|see you|good night/,
    reply: function () {
      return "Goodbye" + (userName ? ", " + userName : "") + "! Have a great day!";
    }
  }
];

// ---------- Decide the reply for a user message ----------
function getBotReply(userText) {
  const text = userText.trim();
  const lower = text.toLowerCase();

  // 1. maths  2. name memory  3. keyword rules
  const mathReply = tryMath(lower);
  if (mathReply) return mathReply;

  const nameReply = tryName(text);
  if (nameReply) return nameReply;

  for (let i = 0; i < rules.length; i++) {
    if (rules[i].test.test(lower)) {
      return rules[i].reply();
    }
  }

  // Fallback when nothing matches
  return pick([
    "I'm not sure I understood that. Try asking about maths, time, jokes or web topics like HTML, CSS and JavaScript. Type \"help\" to see everything I can do.",
    "Sorry, I don't have an answer for that yet. Type \"help\" to see what I can do."
  ]);
}

// ---------- Conversation history (sent to the AI so it remembers context) ----------
const history = [];

// ---------- Ask the AI server for a reply ----------
async function getAIReply() {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history })
  });

  if (!response.ok) {
    throw new Error("Server error: " + response.status);
  }

  const data = await response.json();
  return data.reply;
}

async function sendBotReply(userText) {
  const typing = document.createElement("div");
  typing.classList.add("typing");
  typing.textContent = "Support Bot is typing...";
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  let reply;
  try {
    reply = await getAIReply();              
  } catch (error) {
    console.warn("AI server unavailable, using offline bot.", error);
    reply = "(offline mode) " + getBotReply(userText);
}

  typing.remove();
  addMessage(reply, "received");
  history.push({ role: "assistant", content: reply });
}

// ---------- Handle the submit event ----------
chatForm.addEventListener("submit", function (event) {
  event.preventDefault();                 // stop page reload

  const text = messageInput.value.trim();
  if (text === "") return;                // ignore empty messages

  addMessage(text, "sent");               // show user's message
  history.push({ role: "user", content: text });
  messageInput.value = "";                // clear the input box
  messageInput.focus();

  sendBotReply(text);                     // bot responds to what the user said
});

// ---------- Welcome message on load ----------
window.addEventListener("load", function () {
  addMessage("Hi! Ask me a question, give me a maths problem, or type \"help\" to see what I can do.", "received");
});