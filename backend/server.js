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

    let messages = req.body.messages;

    // fallback se arriva solo testo semplice
    if (!messages) {
      const problem = req.body.problem || req.body.text;
      if (!problem) {
        return res.status(400).json({ error: "Nessun messaggio ricevuto" });
      }

      messages = [
        { role: "system", content: "Sei un meccanico esperto che aiuta a diagnosticare problemi auto." },
        { role: "user", content: problem }
      ];
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    res.json({ reply: response.output_text });

  } catch (err) {
    console.error("OPENAI ERROR:", err);
    res.status(500).json({ error: err.message || err });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
