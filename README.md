# ⚡ CashRadar

> **SME Cash Flow Intelligence Engine.** 
> CashRadar transforms reactive accounting data into proactive cash flow intelligence using Monte Carlo simulations and AI-driven forecasting.

![CashRadar Architecture](https://img.shields.io/badge/Status-MVP_Live-success) ![License](https://img.shields.io/badge/License-MIT-blue)

CashRadar allows small and medium-sized enterprises (SMEs) to upload their bank statements, automatically categorize transactions, and run 10,000 probabilistic simulations to forecast cash runway, predict insolvency risks, and stress-test custom business scenarios (e.g., hiring a new employee, surviving a revenue drop).

---

## 🏗 Architecture & Workflow

CashRadar operates on a heavily decoupled microservice architecture inside an NPM Monorepo.

```mermaid
graph TD
    User([Business Owner]) -->|Uploads CSV / Scenarios| Web[React Frontend]
    Web -->|REST API| Node[Node.js Backend]
    
    subgraph Core API Layer
        Node -->|Parse & Categorize| MI[Merchant Intelligence]
        MI -->|Persist Data| DB[(PostgreSQL)]
    end
    
    Node -->|Send Txn Payload| Py[Python Simulation Engine]
    
    subgraph AI & Forecasting
        Py -->|Time-Series Prediction| Prophet[FB Prophet]
        Py -->|10k Iterations| MC[Monte Carlo Simulator]
        Prophet --> Results[Risk Score & Cones]
        MC --> Results
    end
    
    Results -->|Return Analysis| Node
    Node -->|Evaluate Thresholds| Alerts[Alert Engine]
    Alerts -->|Persist & Notify| DB
    Node -->|Render Dashboard| Web
```

---

## 🛠 Tech Stack

### 1. Frontend (`apps/web`)
- **React 18 + Vite**: Lightning-fast UI rendering.
- **Tailwind CSS**: Utility-first styling for a beautiful, responsive dashboard.
- **Recharts**: Rendering the complex P10/P50/P90 simulation forecast cones.
- **Lucide React**: Crisp iconography.

### 2. Core API (`apps/api`)
- **Node.js / Express**: High-performance REST API.
- **Prisma ORM**: Type-safe database management.
- **PostgreSQL**: Relational data store for transactions, business profiles, and alert thresholds.
- **PapaParse**: Fast, robust CSV ingestion.

### 3. Simulation Engine (`apps/simulation`)
- **Python / FastAPI**: High-speed analytics server.
- **FB Prophet**: Robust time-series forecasting to predict baseline cash flow.
- **NumPy & Pandas**: Running 10,000 randomized Monte Carlo simulations for stress-testing.

---

## 🚀 Getting Started (Local Development)

Because CashRadar is built as an NPM Workspace, you can run the entire multi-language stack with a single command.

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (3.10+)
3. **PostgreSQL** (Running locally or via cloud like Supabase/Neon)

### 1. Installation
Clone the repository and install dependencies at the root level:
```bash
git clone https://github.com/saswatdutta1310/Cash_Radar.git
cd Cash_Radar

# Install Node dependencies across all workspaces
npm install

# Install Python dependencies
cd apps/simulation
pip install -r requirements.txt
cd ../../
```

### 2. Environment Setup
Configure your database in `apps/api/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cashradar"
```
Generate the Prisma Client and push the schema:
```bash
cd apps/api
npx prisma generate
npx prisma db push
cd ../../
```

### 3. Run the Stack
Start the React Frontend, Node API, and Python Simulation Engine simultaneously using our unified start script:
```bash
npm start
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Node API**: [http://localhost:3001](http://localhost:3001)
- **Python Engine**: [http://localhost:8000](http://localhost:8000)

---

## 💡 Key Features
* **Merchant Intelligence Layer**: Automatically cleans and categorizes messy bank transaction strings.
* **Probabilistic Forecasting**: Doesn't just give one static prediction; provides a "Cone of Uncertainty" using P10, P50, and P90 confidence intervals.
* **Scenario Modeling**: Inject hypothetical financial shocks (loans, revenue drops) to see if your business survives.
* **Alert Engine**: Evaluates simulation outputs and fires critical alerts if runway drops below custom thresholds.

---

## 🔄 Data Flow — End-to-End Sequence

```mermaid
sequenceDiagram
    participant U as Business Owner
    participant W as React Frontend
    participant A as Node.js API
    participant M as Merchant Intelligence
    participant D as PostgreSQL
    participant P as Python Engine
    participant AL as Alert Engine

    U->>W: Upload bank statement CSV
    W->>A: POST /api/transactions/upload
    A->>M: categorize(description, direction)
    M-->>A: { category, merchant_name, confidence }
    A->>D: INSERT transactions (batch)
    A-->>W: ✅ { success: true, count: N }

    U->>W: Click "Generate Risk Intelligence"
    W->>A: POST /api/simulations/run
    A->>D: SELECT all transactions
    A->>P: POST /simulate { transactions, horizon, iterations }
    
    rect rgb(40, 44, 52)
        Note over P: 🧠 AI Processing
        P->>P: FB Prophet time-series forecast
        P->>P: 10,000 Monte Carlo iterations
        P->>P: Compute risk score & survival probabilities
    end
    
    P-->>A: { risk_score, runway, insolvency_probs, forecast_data }
    A->>D: INSERT simulation results
    A->>AL: Evaluate alert thresholds
    AL->>D: INSERT triggered alerts
    A-->>W: Return simulation + recommendations
    W->>U: Render Dashboard with forecasts & risk gauge
```

---

## 📁 Project Structure

```
Cash_Radar/
├── apps/
│   ├── api/                          # Node.js Express Backend
│   │   ├── prisma/
│   │   │   └── schema.prisma         # Database schema (12 models)
│   │   ├── services/
│   │   │   └── merchantIntelligence.js  # AI transaction categorizer
│   │   ├── index.js                  # Express routes & business logic
│   │   ├── prisma.config.ts          # Prisma configuration
│   │   ├── package.json
│   │   └── .env                      # DATABASE_URL (git-ignored)
│   │
│   ├── simulation/                   # Python FastAPI Engine
│   │   ├── main.py                   # Prophet + Monte Carlo logic
│   │   └── requirements.txt          # Python dependencies
│   │
│   └── web/                          # React + Vite Frontend
│       ├── public/
│       │   └── favicon.svg
│       ├── src/
│       │   ├── components/
│       │   │   ├── Sidebar.jsx       # Navigation sidebar
│       │   │   └── TopNav.jsx        # Top header with risk badge
│       │   ├── pages/
│       │   │   ├── Onboarding.jsx    # 3-step business setup wizard
│       │   │   ├── Dashboard.jsx     # Risk gauge + forecast chart
│       │   │   ├── Transactions.jsx  # Upload & manage transactions
│       │   │   ├── Simulator.jsx     # What-if scenario builder
│       │   │   ├── Alerts.jsx        # Notification center
│       │   │   └── Settings.jsx      # Integrations & billing
│       │   ├── App.jsx               # Router & layout
│       │   ├── main.jsx              # Entry point
│       │   └── index.css             # Tailwind base styles
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
│
├── package.json                      # Monorepo root (workspaces + scripts)
├── package-lock.json
├── .gitignore
└── README.md
```

---

## 🗄 Database Schema (ERD)

```mermaid
erDiagram
    USER ||--o{ BUSINESS : owns
    BUSINESS ||--o{ TRANSACTION : has
    BUSINESS ||--o{ SIMULATION : runs
    BUSINESS ||--o{ RISK_SCORE : tracks
    BUSINESS ||--o{ ALERT : receives
    BUSINESS ||--|| ALERT_PREFERENCE : configures
    SIMULATION ||--o{ RISK_SCORE : generates

    USER {
        string id PK
        string firebase_uid UK
        string email UK
        string phone
        string name
    }

    BUSINESS {
        string id PK
        string user_id FK
        string name
        string industry
        string revenue_range
    }

    TRANSACTION {
        string id PK
        string business_id FK
        datetime txn_date
        decimal amount
        string description_raw
        string category
        float category_confidence
        string merchant_name
        string direction
    }

    SIMULATION {
        string id PK
        string business_id FK
        string status
        int risk_score
        int cash_runway_p50
        float insolvency_prob_30d
        float insolvency_prob_90d
        float insolvency_prob_180d
        text results_blob_url
    }

    RISK_SCORE {
        string id PK
        string business_id FK
        string simulation_id FK
        int score
        float revenue_volatility_weight
        float cash_reserve_weight
    }

    ALERT {
        string id PK
        string business_id FK
        string type
        string severity
        string title
        string body
        boolean is_read
    }

    ALERT_PREFERENCE {
        string id PK
        string business_id FK
        int cash_runway_threshold_days
        int risk_score_threshold
    }
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/businesses/setup` | Create or update business profile |
| `POST` | `/api/transactions/upload` | Upload CSV bank statement |
| `GET` | `/api/transactions` | List categorized transactions (latest 100) |
| `PATCH` | `/api/transactions/:id/category` | Manually override a transaction's category |
| `GET` | `/api/dashboard` | Fetch latest simulation + AI recommendations |
| `POST` | `/api/simulations/run` | Trigger a 10,000-iteration Monte Carlo simulation |
| `GET` | `/api/alerts` | Fetch all triggered alerts |
| `POST` | `/api/alerts/:id/read` | Mark an alert as read |

### Simulation Engine (Python)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/simulate` | Run Prophet forecast + Monte Carlo simulation |
| `GET` | `/health` | Health check for the Python service |

---

## 📊 CSV Format

CashRadar accepts standard bank statement exports. The expected CSV format:

| Column | Required | Example |
|--------|----------|---------|
| `Date` | ✅ | `2024-01-15` |
| `Description` | ✅ | `UPI/SWIGGY/934821` |
| `Amount` | ✅ | `1,250.00` |
| `Type` | Optional | `Debit` or `Credit` |

> **Tip:** If the `Type` column is missing, the system auto-detects direction from the sign of the Amount (negative = debit).

---

## 🗺 Roadmap

```mermaid
timeline
    title CashRadar Development Roadmap
    
    section MVP (Current)
        CSV Upload & Categorization : done
        Monte Carlo Simulation Engine : done
        Risk Score Dashboard : done
        Scenario Builder : done
        Alert Engine : done
        Settings & Billing UI : done
    
    section V2 (Planned)
        Tally Prime Direct Sync : planned
        Multi-Currency Support : planned
        Real-time Bank Feed (Account Aggregator) : planned
        WhatsApp & SMS Alert Delivery : planned
    
    section V3 (Future)
        AI Cashflow Copilot (Chat Interface) : future
        Industry Benchmarking : future
        Investor-Ready Reports (PDF Export) : future
        Multi-Business Portfolio View : future
```

---

## 🚢 Deployment Guide

| Service | Recommended Platform | Notes |
|---------|---------------------|-------|
| **Frontend** (React) | Vercel / Netlify | Root directory: `apps/web` |
| **Backend** (Node.js) | Render / Railway | Root directory: `apps/api`, Start: `npm start` |
| **Simulation** (Python) | Render / Railway | Root directory: `apps/simulation`, Start: `uvicorn main:app` |
| **Database** (PostgreSQL) | Supabase / Neon | Free tier available for MVP |

### Environment Variables for Production

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | API | PostgreSQL connection string |
| `PYTHON_ENGINE_URL` | API | URL of deployed Python service |
| `VITE_API_BASE_URL` | Web | URL of deployed Node API |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---
