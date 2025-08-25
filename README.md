# 🚀 Divergent Trading Bot Platform

A **Node.js + Express + SQLite** trading bot platform implementing the **HPS Quad Divergence strategy**.  
Users can sign up, link their exchange, or run in demo mode to launch a live/paper trading bot powered by `ccxt`.

---

## ✨ Features
- 📦 Express API (signup, launch, stop bots, list bots, live logs)
- 🗄 SQLite database (persistent user accounts, bots, exchange keys)
- 🤖 Divergent Trading Bot (HPS Quad Divergence strategy)
- 🧪 Paper mode (Free plan) and Live mode (Pro plan)
- 🔌 Render-ready deployment (with persistent disk for DB)
- 📡 Real-time logs via **Server-Sent Events**

---

## 📂 Project Structure

```
/ (root)
├─ server.mjs           # Express backend (API + process manager)
├─ divergence-bot.mjs   # HPS Quad Divergence trading bot
├─ package.json         # Node dependencies + start script
├─ src/                 # React frontend components
├─ README.md            # This file
└─ data/                # SQLite DB (local dev; Render uses /data mount)
```

---

## ⚙️ Environment Variables

Create a `.env` file locally:

```env
PORT=5174
NODE_ENV=development
DB_FILE=./data/app.db
```

Optional tuning:
```env
ATR_PERIOD=14
RR_RATIO=1.5
EMA_FILTER=true
```

---

## 🏃 Running Locally

**Install dependencies:**
```bash
npm install
```

**Start backend:**
```bash
npm start
```

API will be available at:
```
http://localhost:5174
```

---

## 🚀 Deploying to Render

1. Push this repo to GitHub.

2. On [Render](https://render.com):
   - **New → Web Service**
   - **Connect your repo**
   - **Build command:** `npm install`
   - **Start command:** `node server.mjs`
   - **Plan:** Starter ($7/mo)

3. **Add a Persistent Disk:**
   - **Name:** `data`
   - **Path:** `/data`
   - **Size:** 1 GB

4. **Add env var:**
   - **DB_FILE:** `/data/app.db`

Render will deploy and give you a live URL:
```
https://your-service.onrender.com
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/signup` | Create user (returns token) |
| `POST` | `/api/link-exchange` | Save exchange + keys |
| `GET` | `/api/strategies` | List available strategies |
| `POST` | `/api/launch` | Start a new bot |
| `GET` | `/api/bots` | List user's bots |
| `DELETE` | `/api/bots/:id` | Stop a bot |
| `GET` | `/api/logs/:botId` | Stream live logs (SSE) |

---

## 🤖 HPS Quad Divergence Strategy

Implements **John Kurisko's HPS "Holy Grail"** method:

- **4 Stochastic bands** (9,14,21,34 periods)
- **Stage-1:** All bands below 20 (oversold) or above 80 (overbought)
- **Stage-2:** Price makes new low/high but Stoch diverges
- **Entry:** Stoch(9,3) crosses back through 20/80 with EMA confirmation
- **Risk Management:** ATR stops, R:R targets, trailing stops

---

## 🧪 Quick Test (API)

```bash
# 1. Start server
node server.mjs

# 2. Sign up (copy token from response)
curl -X POST http://localhost:5174/api/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}'

# 3. Launch paper trading bot
curl -X POST http://localhost:5174/api/launch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"BTC/USDT","timeframe":"5m","paper":true}'

# 4. Watch live logs
curl http://localhost:5174/api/logs/BOT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛡 Security Notes

- API keys are stored in SQLite (currently plain text).
- 🔒 Consider AES encryption in production.
- Free plan = paper trading only.
- Always include a risk disclaimer when offering this to others.

---

## ⚠️ Disclaimer

**Educational purposes only.** Trading involves risk. Past performance does not guarantee future results. Use at your own risk.

---

## 📜 License

MIT

---

**Built with ❤️ for algorithmic traders**