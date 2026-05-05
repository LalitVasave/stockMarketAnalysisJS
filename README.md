# 📈 Vishleshak: Institutional Financial Intelligence Terminal

**Vishleshak** is a high-performance, real-time financial intelligence platform designed for institutional-grade market analysis and predictive modeling. Built on a decoupled, event-driven architecture, it provides analysts with sub-second market tracking and advanced AI-driven forecasting.

🚀 **Tech Stack**
| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | High-performance UI with concurrent rendering |
| **Styling** | Tailwind CSS 4.0 | Modern design system with Glassmorphism |
| **Charts** | Lightweight Charts | TradingView's professional charting library |
| **Backend** | Node.js + Express | Scalable API & Event-driven server |
| **Database** | PostgreSQL + Prisma | Relational persistence with type-safe ORM |
| **Real-time** | WebSockets (WS) | Full-duplex communication for live ticks |
| **AI Engine** | Worker Threads | Parallel processing for heavy ML computation |
| **DevOps** | Docker + Compose | Containerized microservices architecture |

---

## ✨ Core Features

### 📡 Real-time Market Intelligence
- **Event-Driven UI**: Replaced legacy polling with high-frequency WebSocket updates.
- **NSE Pulse Terminal**: A high-fidelity live tracking board for institutional symbols (Reliance, HDFC, etc.).
- **Live Feed Active State**: Visual confirmation of simulation core synchronization.

### 🧠 Predictive Modeling
- **Decoupled AI Engine**: Forecasting logic (OLS Regression) runs on separate threads to prevent UI blocking.
- **Pipeline Notifications**: Immediate `PIPELINE_UPDATED` signals when server-side processing completes.
- **Custom Regression**: Statistical modeling for intraday price action.

### 🛡️ Institutional Security (RBAC)
- **Role-Based Access**: Strict separation between `USER` and `ADMIN` privileges.
- **Hardened JWT**: Mandatory environment-based secret verification (No hardcoded fallbacks).
- **Secure Demo Portal**: Ephemeral JWT-backed access for Guest Analysts.

---

## 📁 Project Structure
```text
vishleshak/
├── backend/
│   ├── prisma/             # Database schema & migrations
│   ├── middleware/         # Security (Auth & RBAC)
│   ├── server.js           # API, WebSocket & Simulation Core
│   └── aiWorker.js         # Parallel ML worker
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (LiveChart, Sidebar)
│   │   ├── hooks/          # useWebSocket, useMarketSocket
│   │   └── pages/          # Dashboard, Pulse, Prediction, Admin
│   └── vite.config.js
├── gateway/                # (Optional) Microservice Gateway
└── docker-compose.yml      # Infrastructure as Code
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** v20.0.0+
- **Docker Desktop** (Optional, for containerized run)
- **PostgreSQL** (via Supabase or Local)

### 1. Environment Configuration
Create a `backend/.env` file:
```env
DATABASE_URL="postgresql://user:password@host:port/db"
JWT_SECRET="your_secure_institutional_secret"
PORT=3005
```

### 2. Standard Deployment
```bash
# Backend Setup
cd backend
npm install
npx prisma db push
npm start

# Frontend Setup (New Terminal)
cd frontend
npm install
npm run dev
```
- **Backend API**: `http://localhost:3005`
- **Frontend App**: `http://localhost:5173` (or 5174)

### 3. Docker Deployment
```bash
docker-compose up --build
```

---

## 📡 API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | Public | Authenticate & obtain Institutional JWT |
| `GET` | `/api/uploads` | User | Fetch ingestion & prediction history |
| `POST` | `/api/upload` | User | Ingest CSV data and trigger AI pipeline |
| `GET` | `/api/admin/users`| Admin | System-wide audit and user management |

---

## 🎨 System Aesthetics
Vishleshak uses a **Refined Cyber-Indigo** design system featuring:
- **Vibrant Chart Overlays**: High-contrast TradingView candles.
- **Session Monitor**: Real-time visual feedback on link encryption and identity.
- **Terminal Eyebrows**: Metadata-rich headers for institutional context.

📝 **License**
Maintained for Technical Review & Presentation by the **Vishleshak Core Team**.
