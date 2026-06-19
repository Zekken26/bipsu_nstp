# Deployment Plan: Supabase + Vercel + Render

## Phase 1: Supabase Database Setup

1. Go to https://supabase.com → **New project**
2. Note the **Database password** you set
3. After creation, go to **Project Settings → Database → Connection string**
4. Copy **two** connection strings:

   | Name | Port | Example |
   |------|------|---------|
   | **Direct** (URI) | `5432` | `postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres` |
   | **Pooled** (URI) | `6543` | `postgresql://postgres:YOUR_PASSWORD@aws-0-xxx.pooler.supabase.com:6543/postgres` |

   The **Pooled** one (port `6543`) is the "pooler" you were looking for.

---

## Phase 2: Files to Create/Modify

### 1. Create `frontend/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. Create `render.yaml` at project root

```yaml
services:
  - type: web
    name: nstp-backend
    env: node
    rootDir: backend
    buildCommand: npm install && npx prisma generate && npx prisma migrate deploy
    startCommand: node src/server.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: DIRECT_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: CORS_ORIGIN
        sync: false
```

### 3. Edit `backend/prisma/schema.prisma`

Add `directUrl` to datasource block:

```prisma
datasource db {
  provider     = "postgresql"
  url          = env("DATABASE_URL")
  directUrl    = env("DIRECT_URL")
  relationMode = "prisma"
}
```

This makes Prisma use the **pooled** connection for queries and the **direct** connection for migrations.

### 4. Edit `backend/.env.example`

Replace contents with:

```
PORT=5000

# Supabase connection strings (get these from Supabase Dashboard > Project Settings > Database)
# Pooled (port 6543) — used by Prisma at runtime
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"
# Direct (port 5432) — used by Prisma for migrations only
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.REFERENCE.supabase.co:5432/postgres"

JWT_SECRET="change_this_to_a_secure_random_secret"
JWT_EXPIRES_IN="7d"
```

---

## Phase 3: Push Schema to Supabase

From `backend/` directory:

```bash
# Set DATABASE_URL to the DIRECT connection for migration
set DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Push schema
npx prisma migrate dev --name init
```

After migration succeeds, switch `DATABASE_URL` to the **pooled** string for runtime.

---

## Phase 4: Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to https://vercel.com → **Add New Project**
3. Import your GitHub repo
4. Configure:
   - **Root Directory:** `frontend/`
   - **Framework preset:** Vite (auto-detected)
   - **Build command:** `npm run build`
   - **Output directory:** `dist/`
5. Add environment variable:
   - `VITE_API_BASE_URL` = `https://your-app.onrender.com/api`
6. Click **Deploy**

---

## Phase 5: Deploy Backend to Render

1. Go to https://render.com → **New Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `backend/`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `node src/server.js`
4. Add environment variables:
   - `DATABASE_URL` = Supabase **Pooled** connection string (port `6543`)
   - `DIRECT_URL` = Supabase **Direct** connection string (port `5432`)
   - `JWT_SECRET` = (Render can auto-generate or use a strong random string)
   - `JWT_EXPIRES_IN` = `7d`
   - `CORS_ORIGIN` = `https://your-app.vercel.app`
   - `NODE_ENV` = `production`
5. Click **Create Web Service**

---

## Phase 6: Wire Them Together

1. After both deploy, note the Render URL (e.g., `https://nstp-backend.onrender.com`)
2. Go back to Vercel project → **Settings → Environment Variables**
3. Update `VITE_API_BASE_URL` = `https://nstp-backend.onrender.com/api`
4. Redeploy the frontend on Vercel
5. Go back to Render → **Environment** → update `CORS_ORIGIN` = `https://nstp-frontend.vercel.app`
6. Redeploy the backend on Render

---

## Verification

- Visit `https://nstp-backend.onrender.com/health` — should show `{ "ok": true, "database": { "ready": true } }`
- Visit `https://nstp-frontend.vercel.app` — should load and connect to backend

## Environment Variables Summary

| Variable | Where | Value |
|----------|-------|-------|
| `VITE_API_BASE_URL` | Vercel (frontend) | `https://nstp-backend.onrender.com/api` |
| `DATABASE_URL` | Render (backend) | Supabase **Pooled** (port 6543) |
| `DIRECT_URL` | Render (backend) | Supabase **Direct** (port 5432) |
| `JWT_SECRET` | Render (backend) | Strong random string |
| `JWT_EXPIRES_IN` | Render (backend) | `7d` |
| `CORS_ORIGIN` | Render (backend) | `https://nstp-frontend.vercel.app` |
| `NODE_ENV` | Render (backend) | `production` |
