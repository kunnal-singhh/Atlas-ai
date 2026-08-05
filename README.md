# 🤖 Atlas AI

> A production-ready, AI-powered Telegram bot with persistent memory, live intelligence, and personalized scheduled briefings — powered by Google Gemini.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **Persistent Memory** | Remembers facts about you across conversations using semantic deduplication |
| 💬 **AI Chat** | Natural conversation powered by Google Gemini 2.0 Flash |
| 📈 **Finance Intelligence** | Real-time market data & financial analysis via Finnhub |
| 🔍 **Live Web Search** | On-demand web search with caching via Google Custom Search API |
| ☀️ **Morning Brief** | Personalized daily AI-generated briefing based on your profile |
| 🌙 **Evening Summary** | Recap of the day's key topics and market movements |
| 📋 **Weekly Digest** | Curated weekly intelligence report |
| ⏰ **Custom Schedules** | Set your own briefing times per user, with preset or custom time selection |
| 🔔 **Notifications** | Configurable push notifications for market events and updates |
| 👤 **User Profiles** | Onboarding flow that learns your interests, goals, and preferred topics |

---

## 🏗️ Architecture

```
Atlas-ai/
└── backend/
    └── src/
        ├── ai/               # AI memory prompts & tool definitions
        ├── bot/
        │   ├── commands/     # /brief, /schedule, /notifications
        │   ├── controllers/  # Bot, Chat, Settings controllers
        │   ├── helpers/      # Formatting utilities
        │   ├── middlewares/  # Logging, error handling, user hydration
        │   └── routers/      # Command, message & callback routers
        ├── config/           # Environment & bot configuration
        ├── constants/        # Shared constants
        ├── controllers/      # HTTP API controllers
        ├── jobs/             # Background job definitions
        ├── middleware/        # Express middleware
        ├── models/           # Mongoose data models
        │   ├── User.js
        │   ├── Memory.js
        │   ├── Conversation.js
        │   ├── Message.js
        │   ├── Article.js
        │   ├── Profile.js
        │   ├── NotificationPreference.js
        │   └── SearchCache.js
        ├── routes/           # Express API routes
        ├── services/
        │   ├── aiService.js          # AI orchestration
        │   ├── briefingService.js    # Morning/evening/weekly briefings
        │   ├── conversationService.js
        │   ├── cronManager.js        # Cron job lifecycle manager
        │   ├── financeService.js     # Market data pipeline
        │   ├── geminiService.js      # Gemini API wrapper
        │   ├── memoryService.js      # Memory CRUD & deduplication
        │   ├── notificationService.js
        │   ├── onboardingService.js
        │   ├── schedulerService.js   # Per-user schedule management
        │   └── tools/
        │       ├── financeTool.js
        │       ├── liveSearchTool.js
        │       ├── memoryTool.js
        │       ├── profileTool.js
        │       ├── toolExecutor.js
        │       ├── toolRegistry.js
        │       └── toolSelector.js
        ├── utils/            # Logger and helpers
        ├── app.js            # Express app setup
        └── server.js         # Entry point & bootstrap
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 18.0.0`
- **MongoDB** instance (local or Atlas)
- A **Telegram Bot Token** from [@BotFather](https://t.me/BotFather)
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/kunnal-singhh/Atlas-ai.git
cd Atlas-ai/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ── Core ──────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ──────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/atlas-ai

# ── Authentication ────────────────────────────
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# ── Telegram ──────────────────────────────────
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Production only — set to your public HTTPS URL
# WEBHOOK_URL=https://your-domain.com

# ── Google Gemini ─────────────────────────────
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

# ── Finance (Finnhub) ─────────────────────────
FINNHUB_API_KEY=your_finnhub_api_key
FINANCE_NEWS_CATEGORY=general
FINANCE_CACHE_TTL_MINUTES=30

# ── Live Search (Google Custom Search) ────────
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
SEARCH_CACHE_TTL_MINUTES=15

# ── Memory Tuning ─────────────────────────────
MAX_RECENT_MESSAGES=10
MAX_RETRIEVED_MEMORIES=5
MAX_MEMORY_SUMMARY_LENGTH=500
MIN_IMPORTANCE_SCORE=3
```

### 4. Run the Bot

**Development** (with hot-reload via nodemon):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

---

## 🤖 Bot Commands

| Command | Description |
|---|---|
| `/start` | Begin onboarding and set up your profile |
| `/brief` | Request an on-demand intelligence briefing |
| `/schedule` | Manage your morning, evening, and weekly briefing times |
| `/notifications` | Configure notification preferences |

---

## 🧠 How Memory Works

Atlas AI uses a **multi-layer memory pipeline**:

1. **Extraction** — After each conversation, `memoryExtractor.js` identifies memorable facts (interests, preferences, goals, etc.)
2. **Scoring** — `memoryScorer.js` assigns an importance score (1–10) to each candidate memory
3. **Deduplication** — `memoryService.js` performs semantic deduplication using entity matching before saving
4. **Retrieval** — Relevant memories are fetched and injected into the AI context before each response
5. **Validation** — `memoryValidator.js` ensures data quality before persistence

---

## 📅 Scheduled Briefings

Each user can configure three automated briefings:

| Briefing | Default Time | Description |
|---|---|---|
| ☀️ Morning Brief | `08:00 UTC` | Personalized market intel + top news |
| 🌙 Evening Summary | `18:00 UTC` | Daily recap and market close |
| 📋 Weekly Digest | `Monday 09:00 UTC` | Curated weekly intelligence report |

Times are configurable per user via `/schedule` using preset slots or a custom time input.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ (ES Modules) |
| **Framework** | Express.js |
| **Bot Framework** | Telegraf |
| **AI** | Google Gemini (`@google/genai`) |
| **Database** | MongoDB + Mongoose |
| **Scheduler** | node-cron |
| **Finance Data** | Finnhub API |
| **Web Search** | Google Custom Search API |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **Logging** | Winston |
| **Dev** | Nodemon |

---

## 🌐 Deployment

### Development (Long Polling)

In `NODE_ENV=development`, the bot uses **long polling** — no public URL required.

### Production (Webhook)

In `NODE_ENV=production`, the bot automatically registers a **webhook** with Telegram. Set `WEBHOOK_URL` to your public HTTPS URL (e.g., from Railway, Render, or a VPS with nginx).

```env
NODE_ENV=production
WEBHOOK_URL=https://your-domain.com
```

The webhook path is automatically appended using your bot token.

---

## 📁 Key Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | Your Telegram bot token from BotFather |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `JWT_SECRET` | ✅ | Secret for signing JWTs |
| `WEBHOOK_URL` | Production only | Public HTTPS base URL for webhook |
| `FINNHUB_API_KEY` | Optional | Finnhub key for finance features |
| `GOOGLE_SEARCH_API_KEY` | Optional | Google Custom Search key |
| `GOOGLE_SEARCH_ENGINE_ID` | Optional | Google Custom Search engine ID |

---


