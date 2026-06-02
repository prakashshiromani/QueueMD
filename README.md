# 🏥 QueueMD Multi-Tenant SaaS Workspace

Welcome to the QueueMD project repository! This is a production-ready, enterprise-grade healthcare Queue Management System designed for scaling and multi-tenant isolation.

## 📁 Workspace Directory Layout

The workspace is organized as follows:

```
QueueMD/                            ← Workspace Root
├── queue-md-universal/             ← Main SaaS Application Codebase
│   ├── client/                     │   └── React + Zustand Frontend
│   ├── server/                     │   └── Node.js + Express Backend
│   └── python_service/             │   └── FastAPI Predictor Engine
│
├── docs/                           ← High-Level Documentation (Architecture, PRDs)
│
├── .agents/                        ← AI Assistant configurations (Gitignored)
├── graphify/                       ← Graphify visualization tool (Gitignored)
├── graphify-out/                   ← Graphify output assets (Gitignored)
└── prakash-coding-assistant/       ← Developer assistant context (Gitignored)
```

## 🛠️ Development Tools (Gitignored)

This repository includes several development and AI assistant tools that are excluded from Git to prevent repository pollution:
- **`graphify/` & `graphify-out/`**: Used for mapping code dependencies and generating visual graphs.
- **`prakash-coding-assistant/`**: Internal coding assistant templates, scripts, and logs.

For detailed development instructions, setup guides, and environment configurations, please refer to the README inside [queue-md-universal](file:///c:/Users/Prakash%20Max/OneDrive/Desktop/QueueMD/queue-md-universal).
