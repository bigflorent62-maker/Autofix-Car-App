import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

const app = express();
app.use(cors());
app.use(express.json());

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

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

app.post("/ai", async (req,res)=>{
  const { problem } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",   // o quello che usi
    messages: [
      { role:"system", content:"Sei un meccanico esperto che fa diagnosi rapide" },
      { role:"user", content: problem }
    ]
  });

  res.json({
    diagnosis: response.choices[0].message.content,
    workshop: "Officina migliore in zona (demo)"
  });
});


app.post("/book",(req,res)=>{
  const { name, car, problem, workshop, date } = req.body;

  db.run(
    "INSERT INTO bookings VALUES (NULL,?,?,?,?,?,?)",
    [name,car,problem,workshop,date,"pending"]
  );

  res.json({ ok:true });
});

app.get("/dashboard",(req,res)=>{
  db.all("SELECT * FROM bookings",(err,rows)=>{
    res.json(rows);
  });
});

app.post("/complete/:id",(req,res)=>{
  db.run("UPDATE bookings SET status='done' WHERE id=?", [req.params.id]);
  res.json({ ok:true });
});

app.listen(process.env.PORT || 3001);
