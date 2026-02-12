import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/ai", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    const reply = response.output_text;

    res.json({ reply });

  } catch (err) {
    console.error("OPENAI ERROR:", err);
    res.status(500).json({ error: err.message || err });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

