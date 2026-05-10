# NSTP Frontend

Vite, React, TypeScript, and Tailwind CSS frontend for the NSTP Management System.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS

## File Structure

```text
frontend/
|-- public/
|   |-- bipsu-logo.svg
|   `-- nstp-logo.svg
|-- src/
|   |-- assets/
|   |   `-- images/
|   |       `-- splash.png
|   |-- components/
|   |   |-- common/
|   |   |-- layout/
|   |   `-- ui/
|   |-- data/
|   |   `-- nstpData.ts
|   |-- features/
|   |   |-- admin/
|   |   |-- announcements/
|   |   |-- assessments/
|   |   |-- auth/
|   |   |-- dashboard/
|   |   |-- enrollment/
|   |   |-- facilitator/
|   |   |-- grades/
|   |   |-- modules/
|   |   |-- progress/
|   |   `-- reports/
|   |-- hooks/
|   |-- pages/
|   |   |-- AssessmentsPage.tsx
|   |   |-- EnrollmentPage.tsx
|   |   |-- GradesPage.tsx
|   |   |-- LoginPage.tsx
|   |   |-- ModulesPage.tsx
|   |   `-- ReportsPage.tsx
|   |-- services/
|   |   `-- apiClient.ts
|   |-- styles/
|   |   |-- fonts.css
|   |   |-- index.css
|   |   |-- tailwind.css
|   |   `-- theme.css
|   |-- types/
|   |   `-- nstp.ts
|   |-- utils/
|   |-- App.tsx
|   `-- main.tsx
|-- index.html
|-- package.json
`-- README.md
```

## Folder Guide

- `src/pages/` - Top-level page components used by `App.tsx`.
- `src/features/` - Domain-specific screens and supporting components.
- `src/components/common/` - Shared application components.
- `src/components/layout/` - Shared layout shells.
- `src/components/ui/` - Reusable UI primitives.
- `src/services/` - API clients and remote service adapters.
- `src/data/` - Local seed data and storage helpers.
- `src/types/` - Shared TypeScript type exports.
- `src/assets/` - Static assets imported by source code.
- `src/styles/` - Global styles and theme files.

## Environment Variables

Optional `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
