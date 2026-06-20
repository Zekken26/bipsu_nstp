# NSTP Management System

NSTP Management System is a full-stack web application for managing NSTP users, students, modules, assessments, grades, reports, enrollment flows, announcements, and administrative workflows.

The repository is organized as a production-friendly monorepo while keeping the backend and frontend as independent apps.

## Tech Stack

- Frontend: Vite, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL
- ORM: Prisma
- Package manager: npm

## Project Structure

```text
NSTP-Final-main/
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma
|   |   `-- migrations/
|   |-- src/
|   |   |-- cache/
|   |   |-- config/
|   |   |-- data/
|   |   |-- db/
|   |   |-- middleware/
|   |   |-- modules/
|   |   |-- routes/
|   |   |-- utils/
|   |   |-- app.js
|   |   `-- server.js
|   |-- .env.example
|   |-- package.json
|   `-- README.md
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- data/
|   |   |-- features/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- types/
|   |   |-- utils/
|   |   |-- App.tsx
|   |   `-- main.tsx
|   |-- package.json
|   `-- README.md
|
|-- package.json
|-- README.md
`-- .gitignore
```

## Environment Variables

Backend environment file: `backend/.env`

```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nstp_db"
JWT_SECRET=replace-with-a-secure-secret
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Frontend environment file, optional: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Do not commit real `.env` files.

## Backend Setup

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

For a fresh database migration:

```bash
cd backend
npx prisma migrate dev --name init
```

Useful Prisma commands:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Development Commands

From the repository root:

```bash
npm run backend:dev
npm run frontend:dev
npm run frontend:build
npm run prisma:migrate
npm run prisma:studio
```

## Local URLs

- Backend health: `http://localhost:PORT/health`
- Backend DB test: `http://localhost:PORT/api/db-test`
- Frontend dev server: usually `http://localhost:5173`

Your backend port comes from `backend/.env`.
