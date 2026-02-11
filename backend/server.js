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

// DATABASE (resta)
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

// === AGENTE MECCANICO ===
app.post("/ai", async (req, res) => {
  try {
    const { problem, history } = req.body;

    const messages = [
      {
        role: "system",
        content: `
Sei un meccanico professionista con 25 anni di esperienza.
Fai domande mirate.
Non dare diagnosi vaghe.
Analizza sintomi reali.
Guida il cliente verso una diagnosi concreta.
Rispondi in modo chiaro e professionale.
`
      }
    ];

    // Aggiunge storico conversazione
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        messages.push({ role: "user", content: h.user });
        messages.push({ role: "assistant", content: h.ai });
      });
    }

    // Messaggio attuale
    messages.push({ role: "user", content: problem });

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
      temperature: 0.4
    });

    const aiReply = response.choices[0].message.content;

    res.json({
      diagnosis: aiReply,
      workshop: "Officina consigliata in zona (demo)"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore AI" });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running");
});

