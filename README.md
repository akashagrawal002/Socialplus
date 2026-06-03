# 🚀 SocialPulse AI — Full-Stack Social Media Manager

> AI-powered competitor analysis, content generation, trend tracking & engagement platform

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (primary) + Redis (cache/sessions) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Auth | JWT + bcrypt |
| Hosting | Frontend → Vercel / Netlify, Backend → Railway / Render, DB → Supabase / Railway |

---

## 🗂️ Project Structure

```
socialpulse/
├── frontend/          # React app (Vite)
├── backend/           # Node.js Express API
├── database/          # SQL migrations & seeds
├── docker-compose.yml # Local dev environment
├── .env.example       # Environment variables template
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Anthropic API key

### 1. Clone & Install

```bash
git clone https://github.com/yourname/socialpulse.git
cd socialpulse

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
# In /backend
cp .env.example .env
# Fill in your values (see .env.example)

# In /frontend
cp .env.example .env
# Add VITE_API_URL=http://localhost:5000
```

### 3. Database Setup

```bash
cd backend

# Run migrations (creates all tables)
npm run db:migrate

# Optional: seed with sample data
npm run db:seed
```

### 4. Start Development

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Visit: **http://localhost:5173**

---

## 🐳 Docker Setup (Easiest)

```bash
# From root directory
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# pgAdmin: http://localhost:5050
```

---

## 🌐 Deployment

### Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init
railway up
```

### Frontend → Vercel

```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Database → Supabase (Free Tier)

1. Create project at supabase.com
2. Copy connection string to `DATABASE_URL` in backend `.env`
3. Run `npm run db:migrate`

---

## 🔑 API Keys Required

| Service | Where to Get |
|---------|-------------|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `JWT_SECRET` | Generate with `openssl rand -hex 32` |
| `DATABASE_URL` | Supabase / Railway / Local PostgreSQL |
| `REDIS_URL` | Railway Redis / Upstash (free tier) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/competitors` | List competitors |
| POST | `/api/competitors/detect` | Auto-detect competitors |
| POST | `/api/competitors/analyze` | Deep analyze one competitor |
| GET | `/api/trends` | Fetch trends |
| POST | `/api/content/generate` | Generate content |
| POST | `/api/content/reels` | Generate reel ideas |
| GET | `/api/news` | Get social media news |
| POST | `/api/engagement/ideas` | Get engagement ideas |
| GET | `/api/dashboard/stats` | User dashboard stats |
| GET | `/api/history` | Generation history |

---

## 📝 License

MIT — Free to use and modify
