# 🏥 QueueMD — Smart Clinic Queue Management System

> A production-ready **MERN stack SaaS** for multi-tenant clinic queue management, real-time patient tracking, and integrated billing.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green)](https://nodejs.org) [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 📌 Features

- 🏥 **Multi-Tenant Architecture** — One platform, multiple clinics/hospitals isolated by facility
- 🔄 **Real-Time Queue Updates** — Socket.IO powered live queue sync across all devices
- 💳 **Razorpay Billing & Subscriptions** — Automated Pro plan management with webhook validation
- 🔐 **Secure Auth** — JWT Access (15m) + Refresh Tokens (7d HTTP-only cookie)
- 📊 **Analytics Dashboard** — Real MongoDB aggregations for peak hours, wait times, no-shows
- 🔔 **Background Notifications** — BullMQ + Redis powered notification queue worker
- 🧪 **Unit Tests** — Jest + Supertest coverage for critical auth flows
- 📄 **OpenAPI Docs** — Interactive Swagger UI at `/api-docs`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express 5, MongoDB Atlas, Mongoose |
| **Frontend** | React 18, Vite, TailwindCSS, Zustand, Framer Motion |
| **Real-Time** | Socket.IO |
| **Queue/Jobs** | BullMQ + Upstash Redis |
| **Auth/Security** | JWT (Access + Refresh), Helmet, express-rate-limit, Zod |
| **Forms** | react-hook-form + Zod schema validation |
| **Payments** | Razorpay Webhooks + Auto Plan Renewal |
| **Testing** | Jest + Supertest |
| **Docs** | Swagger / OpenAPI 3.0 |

---

## 📦 Prerequisites

- **Node.js** `v18+` and **npm** `v9+`
- **MongoDB Atlas** account (free tier works)
- **Upstash Redis** account (free tier works)
- **Razorpay** test keys (for payment features)

---

## ⚙️ Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/prakashshiromani/QueueMD.git
cd QueueMD/queue-md-universal

# Install backend dependencies
cd server && npm install && cd ..

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Environment Variables

```bash
# Copy the example env file
cp server/.env.example server/.env
```

Then open `server/.env` and fill in your credentials:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster...` |
| `JWT_SECRET` | 64-char random hex string | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | 64-char random hex string (different from JWT_SECRET) | same command as above |
| `REDIS_URL` | Upstash Redis URL | `rediss://default:pass@host:6379` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | from Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret | from Razorpay dashboard |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

### 3. Run Dev Servers

```bash
# Terminal 1 — Backend (from server/)
cd server && npm start

# Terminal 2 — Frontend (from client/)
cd client && npm run dev

# Terminal 3 — Background Worker (from server/)
cd server && npm run worker
```

🌐 **Frontend:** `http://localhost:5173`  
🔌 **Backend API:** `http://localhost:5000`  
📄 **API Docs:** `http://localhost:5000/api-docs`

---

## 📜 Available Scripts

### Backend (`server/`)

| Command | Description |
|---------|-------------|
| `npm start` | Start backend server |
| `npm run dev` | Start with hot-reload (nodemon) |
| `npm run worker` | Start BullMQ notification worker |
| `npm test` | Run Jest test suite |

### Frontend (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 🗂️ Project Structure

```
queue-md-universal/
├── client/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── services/        # API + Socket services
│   │   ├── store/           # Zustand state management
│   │   └── utils/           # Helpers
│   └── package.json
│
└── server/                  # Node.js + Express Backend
    ├── config/              # DB, Swagger config
    ├── controllers/         # Route handlers
    ├── jobs/                # BullMQ workers + crons
    ├── middleware/          # Auth, error handling
    ├── models/              # Mongoose schemas
    ├── routes/              # API routes
    ├── scripts/             # Dev/migration scripts
    ├── sockets/             # Socket.IO handlers
    ├── tests/               # Jest integration tests
    ├── utils/               # Shared utilities (logger, etc.)
    └── server.js            # App entry point
```

---

## 🔒 Security Features

- ✅ **HTTP-only Refresh Tokens** — XSS-proof cookie storage
- ✅ **Rate Limiting** — 10 requests / 15 min on auth routes
- ✅ **Helmet.js** — Security headers (CSP, HSTS, etc.)
- ✅ **Zod Validation** — Type-safe input validation on all routes
- ✅ **Regex Escaping** — ReDoS prevention on search queries
- ✅ **Webhook Signature Verification** — Razorpay HMAC validation
- ✅ **Body Size Limits** — 10kb request body cap

---

## 🚀 Production Deployment Tips

1. Set `NODE_ENV=production` in environment
2. Use **PM2** for process management: `pm2 start server.js --name queuemd-api`
3. Enable **HTTPS** and set `secure: true` on cookies
4. Use **NGINX** as reverse proxy for both frontend and backend
5. Set `CLIENT_URL` to your actual production domain in `.env`
6. **Rotate all secrets** before first production deploy
7. Monitor logs via `server/logs/` directory (Winston structured logs)

---

## 🧪 Running Tests

```bash
cd server
npm test

# With coverage report
npx jest --coverage
```

---

## 📄 License

MIT © 2026 QueueMD Team — Built with ❤️ for healthcare professionals
