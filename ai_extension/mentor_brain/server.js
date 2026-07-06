import express from "express";
import cors from "cors";
import "dotenv/config";
import axios from "axios";

const app = express();

app.use(cors());
app.use(express.json());

// 🧠 SYSTEM PROMPT
const SYSTEM_PROMPT = `
You are a friendly human coding mentor.

Behavior:
- Talk like a real person, not a robot
- Be short and natural
- Only give hints when needed
- Do NOT force hints for casual messages

Rules:
- Never give full code
- If user asks for code → politely refuse and guide

Hints:
- Give 1–2 line hints only
- No long explanations
`;

app.post("/ask", async (req, res) => {
  try {
    let { prompt } = req.body;

    // 🧠 Extract ONLY user message
    const userMessage = prompt.split("User Question:").pop().trim();
    const lower = userMessage.toLowerCase();

    // 💬 Casual human responses
    if (["hi", "hey", "hello"].includes(lower)) {
      return res.json({ reply: "Hey 🙂 what are you working on?" });
    }

    if (lower.includes("how are you")) {
      return res.json({ reply: "Doing great 😄 ready to help you code!" });
    }

    if (["ok", "okay"].includes(lower)) {
      return res.json({ reply: "Nice 👍 try it out!" });
    }

    if (lower.includes("thank")) {
      return res.json({ reply: "Glad it helped 😊" });
    }

    if (lower.includes("bye")) {
      return res.json({ reply: "Good luck 🚀 keep coding!" });
    }

    // 🧠 Intent detection
    let userType = "general";

    if (lower.includes("hint")) userType = "hint";
    else if (lower.includes("more")) userType = "more_hint";
    else if (lower.includes("code")) userType = "no_code";
    else if (lower.includes("solve")) userType = "hint";

    // 🎯 Control instructions
    let control = "";

    if (userType === "hint") {
      control = "Give ONLY 1 short hint.";
    } else if (userType === "more_hint") {
      control = "Give ONLY 2 short hints.";
    } else if (userType === "no_code") {
      control = "Do NOT give code. Give 1 short hint.";
    } else {
      control = "Reply casually in 1 short sentence.";
    }

    // ⚡ Trim problem for speed
    const trimmedProblem = prompt.slice(0, 1200);

    // 🧠 Final prompt sent to AI
    const finalPrompt = `
${control}

${trimmedProblem}
`;

    // 🔥 OpenRouter API call
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/auto",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: finalPrompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "HintHive"
        }
      }
    );

    let reply =
      response.data.choices?.[0]?.message?.content ||
      "Think about input handling.";

    // 🚫 Remove code blocks
    reply = reply.replace(/```[\s\S]*?```/g, "");

    // 🚫 Block code-like responses
    if (
      reply.includes("import") ||
      reply.includes("class") ||
      reply.includes("System.out") ||
      reply.includes("def ") ||
      reply.includes("function")
    ) {
      reply = "I won't give code 🙂 Think about how to process input step by step.";
    }

    // ✂️ Keep it short (max 2 lines)
    let lines = reply.split("\n").filter(l => l.trim() !== "");
    reply = lines.slice(0, 2).join(" ");

    // ✂️ Hard limit
    if (reply.length > 150) {
      reply = reply.slice(0, 150);
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);

    res.json({
      reply: "API issue 😅 Try again or check your key."
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});