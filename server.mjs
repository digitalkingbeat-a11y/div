// --- server.mjs (ESM) ---
import express from "express";
// import other deps you already use (db, spawn, etc.)
// import { spawn } from "node:child_process";
// import db from "./db.js";

const PORT = process.env.PORT || 3000;
const app = express();

/* =========================
   Global Middleware
========================= */
app.use(express.json({ limit: "1mb" }));

// CORS for local development
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization, Cache-Control"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
}); // 👈 closes CORS middleware

/* =========================
   Auth Middleware
========================= */
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "")
    .replace(/^Bearer\s+/i, "")
    .trim();

  if (!token) return res.status(401).json({ error: "Missing token" });

  const session = db
    .prepare("SELECT user_id FROM sessions WHERE token = ?")
    .get(token);
  if (!session) return res.status(401).json({ error: "Invalid session" });

  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(session.user_id);
  if (!user) return res.status(401).json({ error: "User not found" });

  req.user = user;
  next();
} // 👈 closes requireAuth

/* =========================
   Routes (examples)
========================= */

// Public health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Example protected route
app.get("/secure", requireAuth, (req, res) => {
  res.json({ message: `Welcome, ${req.user.name || "user"}` });
});

/* =========================
   SSE / Bot Stream Route
   (adapt this to your code)
========================= */

// runningProcesses Map and child spawn should already exist above.
// Example uses: runningProcesses.get(pid) → child

app.get("/stream/:pid", (req, res) => {
  const pid = Number(req.params.pid);
  const child = runningProcesses.get(pid);
  if (!child) return res.status(404).json({ error: "process not found" });

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control, Authorization");
  res.flushHeaders?.();

  const send = (line) => res.write(`data: ${line.toString().trim()}\n\n`);

  child.stdout?.on("data", send);
  child.stderr?.on("data", send);

  const onExit = () => {
    res.write("event: end\n" + "data: bot-exited\n\n");
    res.end();
  };

  child.once("exit", onExit);

  req.on("close", () => {
    child.stdout?.off("data", send);
    child.stderr?.off("data", send);
    child.off("exit", onExit);
  });
}); // 👈 closes SSE route

/* =========================
   Start Server
========================= */
app.listen(PORT, () => {
  console.log(`Divergent Trading Bot (SQLite) running on http://localhost:${PORT}`);
});

