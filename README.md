# 📈 Vishleshak: Institutional Financial Intelligence Terminal

**Vishleshak** is a high-performance financial intelligence platform designed for institutional-grade market analysis and predictive modeling. Built on a decoupled, parallel-thread architecture, it provides analysts with real-time intraday tracking and advanced AI-driven forecasting for stock and crypto assets.

🚀 **Tech Stack**
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19 + Vite |
| **Styling** | Tailwind CSS 4.0 |
| **Charts** | Lightweight Charts (TradingView) |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (via Supabase) |
| **ORM** | Prisma |
| **Real-time** | WebSocket (ws) |
| **AI Engine** | JavaScript Worker Threads + Custom Regression |

📁 **Project Structure**
```text
vishleshak/
├── backend/
│   ├── prisma/             # Database schema & migrations
│   ├── middleware/         # JWT verification (auth.js)
│   ├── uploads/            # Temporary CSV storage
│   ├── aiWorker.js         # Parallel AI processing unit
│   ├── server.js           # Core API & WebSocket server
│   └── .env                # Server configurations
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (LiveChart, Sidebar, etc.)
│   │   ├── pages/          # Admin, Dashboard, Prediction, DataIngestion
│   │   ├── App.jsx         # Main application logic
│   │   └── index.css       # Global design system
│   └── vite.config.js
├── legacy/                 # Older versions and standalone modules
└── README.md
```

🛠️ **Setup Guide (Step-by-Step)**

### Prerequisites
- **Node.js** v18.0.0+
- **NPM** v9.0.0+
- **PostgreSQL** (Local or Cloud-based like Supabase)

### 1. Clone & Prepare
```bash
git clone https://github.com/LalitVasave/stockMarketAnalysisJS.git
cd vishleshak
```

### 2. Configure Backend
Create a `backend/.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/vishleshak"
DIRECT_URL="postgresql://user:password@localhost:5432/vishleshak"
JWT_SECRET="your-institutional-secret-key"
PORT=3005
```

### 3. Initialize Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm start
```
The server will be running at `http://localhost:3005`.

### 4. Initialize Frontend (New Terminal)
```bash
cd frontend
npm install
npm run dev
```
The terminal will be accessible at `http://localhost:5173`.

🧪 **Test Accounts**
The system uses a simulation mode. Real user accounts are stored in the database.
Check `backend/test-register.cjs` for sample credentials if available.

📡 **API Endpoints**
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | — | Register new analyst |
| `POST` | `/api/login` | — | Login & generate session token |
| `GET` | `/api/uploads` | JWT | Full upload/prediction history |
| `POST` | `/api/predict` | JWT | Trigger AI forecasting engine |
| `POST` | `/api/upload` | JWT | Bulk CSV data ingestion |
| `GET` | `/api/admin/users`| JWT | Institutional administration panel |

🎨 **Features**

### 💻 Live Terminal Dashboard
- **WebSocket Feed**: Real-time market data streaming with sub-second latency.
- **Dynamic SMA**: Integrated Simple Moving Average overlays calculated on-the-fly.
- **Global Context**: High-fidelity charts with responsive scaling.

### 🧠 Advanced Prediction Engine
- **Decoupled Execution**: AI computations are offloaded to separate worker threads.
- **Multi-Model Logic**: Swappable logic between Temporal LSTM and OLS Regression.
- **Institutional Fallback**: Browser-side math modeling if server connection is lost.

### 🛡️ Hardened Security & Admin
- **JWT Protection**: Secure API communication for all institutional data.
- **Admin Diagnostic**: Monitor user activity and system performance from a central panel.

📝 **License**
Documented for Technical Review & Presentation by the **Vishleshak Core Team**.
