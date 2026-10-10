require("dotenv").config();                  
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

// Change the model in .env if this one is unavailable (check Google AI Studio for current names)
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const SYSTEM_PROMPT =
  "You are Support Bot, a friendly assistant inside a live chat web page built for a " +
  "web design lab. Answer the user's questions clearly and correctly. Keep replies short " +
  "(1 to 4 sentences) unless the user asks for detail. Use plain text only, no markdown.";

if (!API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is missing. Add it to your .env file.");
}

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));   // only the public folder is exposed

// ---------- Chat endpoint ----------
app.post("/api/chat", async (req, res) => {
  const incoming = req.body && req.body.messages;

  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Keep the last 20 valid messages; Gemini calls the assistant role "model"
  const contents = incoming
    .slice(-20)
    .filter(function (m) {
      return (
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== ""
      );
    })
    .map(function (m) {
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.slice(0, 2000) }]
      };
    });

  // The conversation must start with a user message
  while (contents.length > 0 && contents[0].role !== "user") {
    contents.shift();
  }
  if (contents.length === 0) {
    return res.status(400).json({ error: "no valid user message found" });
  }

  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: contents,
        generationConfig: { maxOutputTokens: 500 }
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Gemini API error:", response.status, details);
      return res.status(500).json({ error: "Could not get a reply from the AI." });
    }

    const data = await response.json();
    const parts =
      (data.candidates && data.candidates[0] && data.candidates[0].content &&
        data.candidates[0].content.parts) || [];
    const reply = parts.map(function (p) { return p.text || ""; }).join("").trim();

    if (!reply) {
      return res.status(500).json({ error: "Empty reply from the AI." });
    }

    res.json({ reply: reply });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: "Could not get a reply from the AI." });
  }
});

app.listen(PORT, function () {
  console.log("Chat app running at http://localhost:" + PORT);
});