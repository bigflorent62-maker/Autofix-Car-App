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

// === DATABASE (rimane per futuro) ===
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

// === AGENTE MECCANICO STRUTTURATO ===
app.post("/ai", async (req, res) => {
  try {
    const { problem, history } = req.body;

    const messages = [
      {
        role: "system",
        content: `
Sei un meccanico professionista con 25 anni di esperienza.

Regole obbligatorie:
- NON suggerire officine.
- NON dare diagnosi definitiva subito.
- Fai massimo 2 domande alla volta.
- Guida l’utente in modo strutturato.
- Prima raccogli sintomi chiave.
- Poi restringi le possibili cause.
- Scrivi in modo chiaro e diretto.
- Usa frasi brevi.
- Sii metodico.
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
      messages: messages,
      temperature: 0.3
    });

    const aiReply = response.choices[0].message.content;

    res.json({
      diagnosis: aiReply,
      workshop: null   // niente officina ora
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore AI" });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running");
});

