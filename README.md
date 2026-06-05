# 🚀 SocialPulse AI — Multi-AI Social Media Manager

> AI-powered competitor analysis, content generation, trend tracking & engagement platform
> Powered by **Claude (Anthropic) + ChatGPT (OpenAI) + Gemini (Google)**

---

## 🤖 AI Providers

| AI | Model | Best For | API Key Env |
|----|-------|----------|-------------|
| 🤖 Claude | claude-sonnet-4-20250514 | Creative writing, nuanced analysis | `ANTHROPIC_API_KEY` |
| 💬 ChatGPT | gpt-4o | Structured content, copywriting | `OPENAI_API_KEY` |
| ✨ Gemini | gemini-1.5-pro | Research, analysis, news | `GEMINI_API_KEY` |
| ⚡ Compare Mode | All 3 | Side-by-side comparison | All 3 keys |

> Minimum **one** key required. Add all three to unlock Compare Mode.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Redis (optional) |
| AI | Claude API + OpenAI API + Google Gemini API |
| Auth | JWT + bcrypt |

---

## ⚡ Quick Start (Local Development)

### 1. Clone & Install

```bash
cd socialpulse
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
cd backend
cp ../.env.example .env
```

Edit `backend/.env` and fill in your API keys:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://postgres:password@localhost:5432/socialpulse
REDIS_URL=redis://localhost:6379

JWT_SECRET=your_random_32_char_secret

# Add at least ONE — all three enables Compare Mode
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxx
```

Also create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Database Setup

```bash
cd backend
npm run db:migrate
```

### 4. Start Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Visit: **http://localhost:5173**

---

## 🐳 Docker (Easiest)

```bash
# Create .env from template first
cp .env.example backend/.env
# Edit backend/.env with your API keys

docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- pgAdmin: http://localhost:5050

---

## 🌐 cPanel Deployment

### Database
1. cPanel → PostgreSQL Databases → Create DB + User
2. Connection string: `postgresql://user:pass@localhost:5432/dbname`

### Backend (Node.js App)
1. cPanel → Setup Node.js App → Create (Node 18, startup: `src/server.js`)
2. Upload backend files to app root folder
3. Run npm install via cPanel terminal
4. Run `node src/config/migrate.js` to create tables
5. Restart app

### Frontend
1. Run `npm run build` locally (with `VITE_API_URL=https://yourdomain.com`)
2. Upload contents of `dist/` to `public_html/`
3. Add `.htaccess` for SPA routing

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/competitors/detect` | Auto-detect competitors |
| POST | `/api/competitors/analyze` | Deep analyze one competitor |
| POST | `/api/competitors/gaps` | Find content gaps |
| POST | `/api/content/reels` | Generate reel ideas |
| POST | `/api/content/posts` | Generate post ideas |
| POST | `/api/content/hooks` | Generate hooks |
| POST | `/api/content/videos` | Generate video ideas |
| POST | `/api/content/generate` | Full content (script/calendar) |
| POST | `/api/trends` | Fetch live trends |
| POST | `/api/trends/to-content` | Trend → content |
| POST | `/api/news` | Social media news |
| POST | `/api/engagement/ideas` | Engagement ideas |
| POST | `/api/engagement/reply` | Comment reply generator |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET | `/api/history` | Generation history |

### AI Provider in requests

Every AI endpoint accepts `provider` and `compare` params:

```json
{
  "provider": "claude",   // "claude" | "chatgpt" | "gemini"
  "compare": false        // true = call all 3 simultaneously
}
```

---

## 🔑 Get API Keys

| Provider | URL |
|---------|-----|
| Claude | https://console.anthropic.com |
| ChatGPT | https://platform.openai.com/api-keys |
| Gemini | https://aistudio.google.com/app/apikey |

---

## 📝 License

MIT — Free to use and modify
