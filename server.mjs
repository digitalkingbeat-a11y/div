import 'dotenv/config';
import express from 'express';
import { nanoid } from 'nanoid';

import { spawn } from 'child_process';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import path from 'path';

const PORT = process.env.PORT || 5174;
const DB_FILE = process.env.DB_FILE || './data/app.db';

// Ensure data directory exists
mkdirSync(path.dirname(DB_FILE), { recursive: true });

// Initialize SQLite database
const db = new Database(DB_FILE);

// Track running processes
const runningProcesses = new Map();

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    config TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);




// --- helpers ---
const newId = () => nanoid(24);

// --- AUTH: email-based signup + session token ---
// POST /api/signup  { email, plan? }
app.post('/api/signup', (req, res) => {
  const { email, plan = 'free' } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });

  // create or reuse user
  let user = db.prepare('SELECT id, email, plan FROM users WHERE email = ?').get(email);
  if (!user) {
    const id = newId();
    db.prepare('INSERT INTO users (id, email, plan) VALUES (?,?,?)').run(id, email, plan);
    user = { id, email, plan };
  }

  // issue session token
  const token = newId();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?,?)').run(token, user.id);

  res.json({ token, user });
});

// --- auth middleware (Bearer <token>) ---
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const sess = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  if (!sess) return res.status(401).json({ error: 'Unauthorized' });
  req.user = db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(sess.user_id);
  next();
}

// --- simple status page for "/" ---
app.get('/', (_req, res) => {
  res.send('🚀 Trading Bot Server live. Try POST /api/signup then GET /api/strategies');
});

// --- strategies (public) ---
app.get('/api/strategies', (_req, res) => {
  res.json({
    strategies: [
      { id: 'rsi_macd_div', label: 'RSI+MACD Divergence' },
      { id: 'hidden_div',   label: 'Hidden Divergence' },
      { id: 'hps_quad',     label: 'HPS Quad Divergence' },
    ],
  });
});

const PLANS = {
  free: { name: 'Free', paperOnly: true },
  pro: { name: 'Pro', paperOnly: false },
};

// Divergent Engine
const DivergentEngine = {
  id: 'divergent',
  name: 'Divergent',
  strategies: () => [
    { id: 'rsi_macd_div', label: 'RSI+MACD Divergence' },
    { id: 'hps_quad_div', label: 'HPS Quad Divergence' },
  ],
  validate: ({ symbol, timeframe }) => !!symbol && !!timeframe,
  start: async ({ user, symbol, timeframe, paper, sandbox, config }) => {
    const pidLabel = nanoid(8);
    
    // Get user's exchange connection for API keys
    const connection = db.prepare('SELECT * FROM connections WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id);
    
    const env = {
      ...process.env,
      EXCHANGE: connection?.exchange || 'binance',
      SYMBOL: symbol,
      TIMEFRAME: timeframe,
      DRY_RUN: String(paper),
      API_KEY: (!paper && connection?.api_key) ? connection.api_key : '',
      API_SECRET: (!paper && connection?.api_secret) ? connection.api_secret : '',
      RISK_PER_TRADE: config?.riskPct || '0.01',
      RR_RATIO: config?.rrRatio || '1.5',
      STOCH_PERIODS: config?.stochPeriods || '9,14,21,34',
      EMA_FILTER: config?.useEmaFilter !== false ? 'true' : 'false',
    };
    
    try {
      const child = spawn('node', ['divergence-bot.mjs'], { 
        env, 
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      const processId = child.pid?.toString() || pidLabel;
      runningProcesses.set(pidLabel, child);
      
      // Log bot output
      child.stdout?.on('data', (data) => {
        console.log(`[DIV-${pidLabel}] ${data.toString().trim()}`);
      });
      
      child.stderr?.on('data', (data) => {
        console.error(`[DIV-${pidLabel}] ERROR: ${data.toString().trim()}`);
      });
      
      child.on('close', (code) => {
        console.log(`[DIV-${pidLabel}] Process exited with code ${code}`);
        runningProcesses.delete(pidLabel);
        // Update bot status in database
        db.prepare('UPDATE bots SET status = ? WHERE pid = ?').run('stopped', pidLabel);
      });
      
      console.log(`[DIV-${pidLabel}] Started bot`, { 
        user: user.email, symbol, timeframe, paper, sandbox, config 
      });
      
      return { pid: pidLabel };
    } catch (error) {
      console.error(`[DIV-${pidLabel}] Failed to start bot:`, error);
      throw error;
    }
  },
  stop: async ({ pid }) => {
    const child = runningProcesses.get(pid);
    if (child && !child.killed) {
      child.kill('SIGTERM');
      runningProcesses.delete(pid);
      console.log(`[DIV-${pid}] Bot stopped`);
    } else {
      console.log(`[DIV-${pid}] Process not found (may have already stopped)`);
    }
// Middleware
app.use(express.json({ limit: '1mb' }));

// CORS for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ✅ Only keep ONE definition of requireAuth
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  if (!session) return res.status(401).json({ error: 'Invalid session' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user) return res.status(401).json({ error: 'User not found' });

  req.user = user;
  next();
}

// Signup
app.post('/api/signup', (req, res) => {
  const { email, plan = 'free' } = req.body || {};
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return res.status(400).json({ error: 'valid email required' });
  }
  
  try {
    // Check if user already exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      // Create new user
      const id = nanoid(10);
      const validPlan = PLANS[plan] ? plan : 'free';
      db.prepare('INSERT INTO users (id, email, plan) VALUES (?, ?, ?)').run(id, email, validPlan);
      user = { id, email, plan: validPlan };
    }
    
    // Create session
    const token = nanoid(24);
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);
    
    return res.json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Link exchange
app.post('/api/link-exchange', requireAuth, (req, res) => {
  const { exchange, sandbox = true, apiKey = '', apiSecret = '' } = req.body || {};
  if (!exchange) return res.status(400).json({ error: 'exchange required' });
  
  try {
    const id = nanoid(10);
    db.prepare('INSERT INTO connections (id, user_id, exchange, sandbox, api_key, api_secret) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.user.id, exchange, sandbox ? 1 : 0, apiKey, apiSecret);
    
    // Return connections (mask sensitive data)
    const connections = db.prepare('SELECT id, exchange, sandbox FROM connections WHERE user_id = ?').all(req.user.id);
    
    return res.json({ ok: true, connections });
  } catch (error) {
    console.error('Link exchange error:', error);
    return res.status(500).json({ error: 'Failed to link exchange' });
  }
});

// Strategies
app.get('/api/strategies', requireAuth, (req, res) => {
  return res.json({ strategies: DivergentEngine.strategies() });
});

// Launch bot
app.post('/api/launch', requireAuth, async (req, res) => {
  const { symbol = 'BTC/USDT', timeframe = '5m', strategyId = 'rsi_macd_div', paper = true, sandbox = true, config = {} } = req.body || {};
  const plan = PLANS[req.user.plan] || PLANS.free;
  if (plan.paperOnly && !paper) return res.status(402).json({ error: 'Live trading requires Pro' });
  if (!DivergentEngine.validate({ symbol, timeframe })) return res.status(400).json({ error: 'Invalid config' });

  try {
    const { pid } = await DivergentEngine.start({ user: req.user, symbol, timeframe, paper, sandbox, config });
    const id = nanoid(8);
    const created_at = new Date().toISOString();
    
    db.prepare('INSERT INTO bots (id, user_id, engine, symbol, timeframe, strategy_id, status, pid, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, req.user.id, 'divergent', symbol, timeframe, strategyId, 'running', pid, created_at);
    
    return res.json({ 
      ok: true, 
      bot: { id, engine: 'divergent', symbol, timeframe, strategyId, status: 'running', pid } 
    });
  } catch (error) {
    console.error('Launch bot error:', error);
    return res.status(500).json({ error: 'Failed to launch bot' });
  }
});

// List bots
app.get('/api/bots', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, engine, symbol, timeframe, strategy_id AS strategyId, status, pid, created_at FROM bots WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  return res.json({ bots: rows });
});

// Stop bot
app.delete('/api/bots/:id', requireAuth, async (req, res) => {
  const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: 'Bot not found' });
  
  try {
    await DivergentEngine.stop({ pid: bot.pid });
    db.prepare('DELETE FROM bots WHERE id = ?').run(req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Stop bot error:', error);
    return res.status(500).json({ error: 'Failed to stop bot' });
  }
});

// Live logs via Server-Sent Events
app.get('/api/logs/:botId', requireAuth, (req, res) => {
  const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.botId, req.user.id);
  if (!bot) return res.status(404).end();
  
  const child = runningProcesses.get(bot.pid);
  if (!child) return res.status(410).end();

 res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Authorization');
res.flushHeaders?.();

const send = (line) => res.write(`data: ${line.toString().trim()}\n\n`);

child.stdout?.on('data', send);
child.stderr?.on('data', send);

const onExit = () => {
  res.write('event: end\n' + 'data: bot-exited\n\n');
  res.end();
};

child.once('exit', onExit);

req.on('close', () => {
  child.stdout?.off('data', send);
  child.stderr?.off('data', send);
  child.off('exit', onExit);
});

app.listen(PORT, () => {
  console.log(`Divergent Trading Bot (SQLite) running on http://localhost:${PORT}`);
});
