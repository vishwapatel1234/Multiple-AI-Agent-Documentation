# 🤖 Multi-Document RAG Research Assistant

> An intelligent, multi-agent AI system that transforms raw client requirements into **enterprise-grade software documentation** — complete with architecture diagrams, cost estimation in INR, tech stack recommendations, and exportable PDF reports.

[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google)](https://ai.google.dev)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow)](https://opensource.org/licenses/ISC)

---

## ✨ What It Does

Paste raw, unstructured client requirements → The system spins up **6 specialized AI agents** in sequence → You get a full professional project documentation document in minutes.

### 🧠 The Multi-Agent Pipeline

| Agent | Role | Output |
|-------|------|--------|
| **Requirement Analyzer** | Senior Business Analyst | Structured requirements, assumptions, gaps |
| **Research Agent** | Tech Researcher | Tech stack options with pros/cons |
| **Cost & Timeline Agent** | Financial Planner | INR-based cost ranges, team composition, phase breakdown |
| **Module Breakdown Agent** | System Architect | Functional modules with features and dependencies |
| **Final Doc Generator** | Technical Writer | Full professional Markdown documentation |
| **Config Suggester** | CTO Advisor | Smart team & stack auto-suggestions |

---

## 🚀 Features

- 🔁 **Model Fallback Chain** — Auto-retries across `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-3-flash-preview`
- 📄 **PDF Export** — Export any generated document as a downloadable PDF
- 💾 **SQLite Persistence** — All projects and their data stored locally
- 📊 **Token Cost Tracking** — Real-time stats on API usage per project and per step
- 🎨 **React Dashboard** — Clean UI to manage projects, view docs, and track stats
- 🔒 **Secure** — API keys stored in `.env`, never committed to version control

---

## 🗂️ Project Structure

```
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Dashboard, CreateProject, ProjectDetails, Stats
│   │   ├── components/      # Layout, EnhancedDocViewer
│   │   └── api.js           # Axios API client
│   └── vite.config.js
│
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── ai/
│   │   │   └── aiService.js         # 6 AI agents (Gemini-powered)
│   │   ├── controllers/
│   │   │   └── projectController.js # REST endpoint handlers
│   │   ├── services/
│   │   │   ├── pdfService.js        # PDF generation
│   │   │   └── costService.js       # Token usage tracking
│   │   ├── db/
│   │   │   └── connection.js        # SQLite (better-sqlite3)
│   │   └── rules/
│   │       └── validation.js        # Input validation (Zod)
│   ├── index.js             # Express server entry point
│   └── .env                 # API keys (not committed)
│
└── README.md
```

---

## ⚙️ Tech Stack

### Backend
| Package | Purpose |
|---------|---------|
| `express` v5 | REST API server |
| `@google/generative-ai` | Gemini AI integration |
| `better-sqlite3` | Local SQLite database |
| `html-pdf-node` | PDF generation |
| `marked` | Markdown → HTML rendering |
| `zod` | Runtime schema validation |
| `dotenv` | Environment variable management |

### Frontend
| Package | Purpose |
|---------|---------|
| `react` v19 | UI framework |
| `react-router-dom` v7 | Client-side routing |
| `axios` | HTTP requests |
| `lucide-react` | Icon library |
| `vite` | Build tool & dev server |

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** v18+ 
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/yadavabhi2828-beep/Multi-Document-RAG-Research-Assistant.git
cd Multi-Document-RAG-Research-Assistant
```

### 2. Set Up the Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=4000
```

Start the server:

```bash
node index.js
```

The API will be running at **http://localhost:4000**

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The UI will be running at **http://localhost:5173**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/projects` | Create a new project (triggers full AI pipeline) |
| `GET` | `/api/projects` | List all projects |
| `GET` | `/api/projects/:id` | Get a single project with full documentation |
| `GET` | `/api/projects/:id/pdf` | Export project as PDF |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `POST` | `/api/suggest-config` | Get AI-suggested team & tech stack |
| `GET` | `/api/stats` | View token usage and cost stats |

---

## 💡 Usage Example

1. Open the dashboard at `http://localhost:5173`
2. Click **New Project**
3. Paste your client's requirements (raw, unstructured text is fine)
4. Click **Generate** and watch the 6 agents process your input
5. Review the generated documentation — architecture, cost, modules, and more
6. Export as **PDF** or copy the Markdown

---

## 📊 Cost Estimation

The system estimates project costs using **India-based developer rates (INR)**:

| Level | Annual Rate |
|-------|------------|
| Junior Developer | ₹2,00,000 – ₹2,50,000 |
| Mid-Level Developer | ₹4,00,000 – ₹5,00,000 |
| Senior Developer | ₹10,00,000 – ₹14,00,000 |

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `PORT` | ❌ No | Server port (default: `3000`) |

> ⚠️ **Never commit your `.env` file.** It is excluded via `.gitignore`.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">Built with ❤️ using Google Gemini AI · React · Express · SQLite</p>
