import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/ai", async (req, res) => {
  try {
    const { problem } = req.body;

    if (!problem) {
      return res.status(400).json({ error: "Campo 'problem' mancante" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Sei un meccanico esperto. Fai massimo 1-2 domande alla volta. Dopo alcune risposte fornisci una diagnosi probabile con percentuali. Non dilungarti.",
        },
        {
          role: "user",
          content: problem,
        },
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({ error: "Errore AI backend" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
