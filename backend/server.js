import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

// DB futuro
const db = new sqlite3.Database("./db.sqlite");

db.run(`
CREATE TABLE IF NOT EXISTS bookings (
 id INTEGER PRIMARY KEY,
 name TEXT,
 car TEXT,
 problem TEXT,
 workshop TEXT,
 date TEXT,
 status TEXT
)`);

app.post("/ai", async (req, res) => {
  try {
    const { problem, history } = req.body;

    const messages = [
      {
        role: "system",
        content: `
Sei un meccanico professionista esperto.

Obiettivo:
aiutare l’utente a capire PROBABILMENTE il problema.

Regole:
• Fai 1–2 domande alla volta
• Dopo 3–5 scambi chiudi con una stima
• Elenca 1–3 cause con percentuali (100% totale)
• Non continuare oltre la chiusura
• Linguaggio semplice
• Nessuna officina
`
      }
    ];

    if (history && Array.isArray(history)) {
      history.forEach(h => {
        messages.push({ role: "user", content: h.user });
        messages.push({ role: "assistant", content: h.ai });
      });
    }

    messages.push({ role: "user", content: problem });

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.35
    });

    const reply = response.choices[0].message.content;

    res.json({
      diagnosis: reply
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore AI" });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running");
});

