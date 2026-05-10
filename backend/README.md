# NSTP Backend

Express API for the NSTP Management System using PostgreSQL and Prisma ORM.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM

## File Structure

```text
backend/
|-- prisma/
|   |-- schema.prisma
|   `-- migrations/
|-- src/
|   |-- cache/
|   |   |-- cacheStore.js
|   |   `-- ttlPolicies.js
|   |-- config/
|   |   |-- cors.js
|   |   `-- env.js
|   |-- data/
|   |   `-- mock/
|   |       `-- mockDb.js
|   |-- db/
|   |   `-- prisma.js
|   |-- middleware/
|   |   |-- errorHandler.js
|   |   |-- notFound.js
|   |   |-- rateLimit.js
|   |   `-- validateRequest.js
|   |-- modules/
|   |   |-- assessments/
|   |   |-- auth/
|   |   |-- events/
|   |   |-- follows/
|   |   |-- grades/
|   |   |-- modules/
|   |   |-- nstp/
|   |   |-- payments/
|   |   `-- students/
|   |-- routes/
|   |   `-- index.js
|   |-- utils/
|   |   |-- apiResponse.js
|   |   |-- asyncHandler.js
|   |   `-- logger.js
|   |-- app.js
|   `-- server.js
|-- .env.example
|-- package.json
`-- README.md
```

Each backend module follows this pattern:

```text
module-name/
|-- module-name.routes.js
|-- module-name.controller.js
`-- module-name.service.js
```

Routes define endpoints, controllers handle HTTP request/response behavior, and services contain business logic plus Prisma/database access.

## Environment Variables

Create `backend/.env` from `backend/.env.example`.

```env
PORT=8080
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nstp_management_db"
JWT_SECRET=replace-with-a-secure-secret
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

## Setup

```bash
npm install
npx prisma generate
npm run dev
```

For first-time database setup or schema changes:

```bash
npx prisma migrate dev --name init
```

## Scripts

```bash
npm run dev
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Core Routes

- `GET /health`
- `GET /api/db-test`
- `GET /api/auth/status`
- `GET /api/students`
- `GET /api/modules`
- `GET /api/modules/:id`
- `PUT /api/modules/:id`
- `GET /api/assessments`
- `GET /api/grades`
- `GET /api/nstp/summary/admin`
- `GET /api/nstp/:collection`
- `POST /api/nstp/:collection`
- `POST /api/payments/charge`
- `POST /api/follows`
- `GET /api/events/stream`
