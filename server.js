import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("."));

/* =========================
   🔐 SITE PASSWORD (LOCK)
   ========================= */
const SITE_PASSWORD = "Hyper@nova8912312345623";

/* =========================
   🔐 LOGIN ENDPOINT
   ========================= */
app.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === SITE_PASSWORD) {
    return res.json({ ok: true });
  }

  return res.status(401).json({ ok: false });
});

/* =========================
   🤖 AI ENDPOINT (PROTECTED)
   ========================= */
app.post("/ai", async (req, res) => {
  // simple protection
  if (req.headers["x-auth"] !== "ok") {
    return res.status(403).json({ reply: "access denied" });
  }

  const prompt = req.body.text;

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing");
    return res.status(500).json({ reply: "server misconfigured" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI focused purely on creativity. Create. Do not explain."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ OpenAI HTTP error:", response.status, text);
      return res.status(500).json({ reply: "openai error" });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("❌ Invalid OpenAI response:", data);
      return res.status(500).json({ reply: "invalid ai response" });
    }

    res.json({ reply });

  } catch (err) {
    console.error("❌ OPENAI REQUEST FAILED:", err);
    res.status(500).json({ reply: "server error" });
  }
});

/* =========================
   🚀 START SERVER
   ========================= */
app.listen(3000, () => {
  console.log("🚀 Hypernova running at http://localhost:3000");
  console.log("🔑 API key loaded:", !!process.env.OPENAI_API_KEY);
});
