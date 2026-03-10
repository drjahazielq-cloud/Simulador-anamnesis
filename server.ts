import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("anamnesis.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    caseId TEXT,
    date INTEGER,
    transcript TEXT,
    evaluation TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/attempts", (req, res) => {
    const attempts = db.prepare("SELECT * FROM attempts ORDER BY date DESC").all();
    res.json(attempts.map((a: any) => ({
      ...a,
      transcript: JSON.parse(a.transcript),
      evaluation: a.evaluation ? JSON.parse(a.evaluation) : null
    })));
  });

  app.post("/api/attempts", (req, res) => {
    const { id, caseId, date, transcript, evaluation } = req.body;
    const stmt = db.prepare("INSERT INTO attempts (id, caseId, date, transcript, evaluation) VALUES (?, ?, ?, ?, ?)");
    stmt.run(id, caseId, date, JSON.stringify(transcript), JSON.stringify(evaluation));
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
