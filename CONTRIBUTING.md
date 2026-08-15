# Contributing Guide

Guidelines and setup instructions for the AgriEtech backend project.

---

## 🏗️ Project Structure

```
src/
├── config/       # DB, Redis, Socket.IO, Environment variables
├── delivery/     # SMS (Africa's Talking), USSD (*804#), Push, WebSocket
├── ingestion/    # Satellite connectors & BullMQ background jobs
├── middleware/   # Auth (JWT/RBAC), Request Logging, Error Handling, Validation
├── modules/      # REST API modules (Routes, Controllers, Services)
├── processing/   # Hazard risk algorithms (SPI, VCI, Floods, Locusts)
├── utils/        # Geospatial, Date/Season, and Logger helpers
├── app.js        # Express app definition & routes
└── server.js     # Server entry point
```

---

## 🚀 Setup

### Prerequisites
- Node.js (v18 or v20)
- npm
- Docker (optional, for local PostgreSQL & Redis)

### Installation
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Start development server
npm run dev
```

---

## 🧪 Testing & Code Quality

```bash
# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

---

## 🌿 Git Workflow

1. Create a feature branch: `git checkout -b feature/your-module`
2. Write clean code with single-line comments where necessary.
3. Verify `npm test` and `npm run lint` pass.
4. Submit a Pull Request.
