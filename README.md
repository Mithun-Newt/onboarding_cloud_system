# Junior School Admissions & Onboarding System

Staff-operated, LAN-hosted admissions management system for private junior schools.

---

## Overview

This system replaces manual admission workflows (printed forms, spreadsheets, Google Drive) with a secure, local web application accessible only to authorised school staff.

**Key features:**
- Staff-only access (no parent portal, no public routes)
- Registration → Admission → Document Verification → Fee Collection workflow
- 13 built-in reports with CSV export and print
- Audit log for all data changes
- Docker Compose deployment on the school LAN

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, React, Tailwind CSS, shadcn/ui |
| Backend | Next.js Server Actions, Route Handlers |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth.js v4 (credentials, JWT) |
| Passwords | bcryptjs (bcrypt-compatible) |
| File storage | Local filesystem (`storage/uploads/`) |
| Deployment | Docker Compose |

---

## Prerequisites

- **Docker Desktop** (Windows) — install from docker.com
- **Node.js 20+** (for local dev only)
- **Git**

---

## Quick Start (Production / LAN)

### 1. Clone the repository

```bat
git clone <repo-url>
cd Onboarding
```

### 2. Configure environment

```bat
copy .env.example .env
```

Edit `.env` and set:
```
NEXTAUTH_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NEXTAUTH_URL=http://<server-ip>:3000
NEXT_PUBLIC_SCHOOL_NAME=Appu Arivaalayam
```

### 3. Build and seed

```bat
build_and_deploy.bat seed
```

This will:
1. Build the Docker images
2. Start PostgreSQL and the app
3. Run database migrations
4. Seed default data (school, grades, roles, admin user)

### 4. Access the system

Open a browser and navigate to:
```
http://<server-ip>:3000
```

From other devices on the LAN, use the server's IP address.

---

## Default Login

> **⚠️ CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN**

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin@12345` |

The system will force a password change on first login.

---

## Page Reference

| Page | Path |
|------|------|
| Login | `/login` |
| Dashboard | `/dashboard` |
| Registrations List | `/registrations` |
| New Registration | `/registrations/new` |
| Registration Detail | `/registrations/[id]` |
| Admissions List | `/admissions` |
| Admission Detail | `/admissions/[id]` |
| Documents | `/documents` |
| Payments | `/payments` |
| Reports | `/reports` |
| Settings | `/settings` |
| Academic Years | `/settings/academic-years` |
| Staff Users | `/settings/users` |
| Grades | `/settings/grades` |
| Seat Capacity | `/settings/seat-capacity` |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5432/school_admissions` |
| `NEXTAUTH_URL` | Full URL of the app | `http://192.168.1.100:3000` |
| `NEXTAUTH_SECRET` | Random secret (min 32 chars) | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_NAME` | App title shown in browser | `Junior School Admissions` |
| `NEXT_PUBLIC_SCHOOL_NAME` | School name in UI | `St. Mary's School` |
| `UPLOAD_DIR` | Upload folder path | `./storage/uploads` |
| `MAX_FILE_SIZE_MB` | Max document upload size | `10` |

---

## Docker Commands

```bat
:: Build images
build_and_deploy.bat build

:: Start (with migrations)
build_and_deploy.bat start

:: Start + seed database
build_and_deploy.bat seed

:: Run migrations only
build_and_deploy.bat migrate

:: View logs
build_and_deploy.bat logs

:: Stop
build_and_deploy.bat stop
```

---

## Database Setup Without Docker

If Docker is not available, use the standalone SQL script to create and seed the schema directly on an existing PostgreSQL instance.

### 1. Create the database

```sql
CREATE DATABASE school_admissions;
```

### 2. Run the init script

```bat
psql -U postgres -d school_admissions -f database\init.sql
```

Or on Linux/macOS:

```bash
psql -U postgres -d school_admissions -f database/init.sql
```

The script is **idempotent** — safe to run multiple times. It creates all enums, tables, indexes, views, and seeds:

| Seed data | Count |
|-----------|-------|
| School + Campus | 1 each |
| Academic Year (2026-27, current) | 1 |
| Grades (Pre-KG → Grade 2) | 5 |
| Seat capacity (40 per grade) | 5 |
| Roles | 7 |
| Admin user (`admin` / `Admin@12345`) | 1 |
| Enquiry sources | 8 |
| Document types | 7 |
| Vaccine types | 5 |
| Fee items | 6 |
| App settings | 3 |

### 3. Set DATABASE_URL in .env

```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/school_admissions
```

### 4. Generate Prisma client and start the app

```bat
npm install
npm run db:generate
npm run dev
```

> **Note:** Skip `npm run db:migrate` and `npm run db:seed` — the `init.sql` script replaces both when using a pre-existing PostgreSQL instance.

---

## Local Development (with Docker)

```bat
:: Install dependencies
npm install

:: Generate Prisma client
npm run db:generate

:: Start PostgreSQL (Docker needed, or use local Postgres)
docker run -d --name school_dev_db -e POSTGRES_DB=school_admissions -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine

:: Run migrations
npm run db:migrate

:: Seed data
npm run db:seed

:: Start dev server
npm run dev
```

Open http://localhost:3000

---

## Backup & Restore

### Backup (run from server)
```bat
docker exec school_db pg_dump -U postgres school_admissions > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

### Restore
```bat
docker exec -i school_db psql -U postgres school_admissions < backup_20260101.sql
```

### Backup uploaded files
Copy the Docker volume or the `storage/uploads/` folder to a USB drive or network share.

---

## Roles & Permissions

| Role | Can Do |
|------|--------|
| SYSTEM_ADMIN | Everything — user management, all data |
| VICE_PRINCIPAL | All admissions, confirm, reports |
| ADMISSION_STAFF | Create/edit registrations & admissions |
| CASHIER | Record payments, view receipts |
| DOCUMENT_VERIFIER | Upload, verify, reject documents |
| TRANSPORT_STAFF | Manage transport assignments |
| READ_ONLY_MANAGEMENT | View all data, run reports — no edits |

---

## Troubleshooting

**App not starting:**
- Check `docker ps` — is the postgres container healthy?
- Check `build_and_deploy.bat logs`

**Cannot log in:**
- Verify the admin user exists: `docker exec school_db psql -U postgres school_admissions -c "SELECT username, is_active FROM staff_users;"`

**Database migration failed:**
- Run `build_and_deploy.bat migrate`

**File upload fails:**
- Check `MAX_FILE_SIZE_MB` in `.env`
- Only PDF, JPG, JPEG, PNG are allowed

**Lost admin password:**
- Reset via `docker exec school_db psql -U postgres school_admissions -c "UPDATE staff_users SET password_hash='<bcrypt-hash>' WHERE username='admin';"`

---

## Handover to Another Developer

1. Share this repository (Git)
2. Share the `.env` file securely (never commit it)
3. Share the database backup file
4. Share the `storage/uploads/` Docker volume export
5. Provide access to this README

The codebase uses standard Next.js 14 App Router conventions. Business logic is in `features/*/actions.ts`. DB access is through Prisma in `lib/prisma.ts`. Auth is in `lib/auth.ts`.

---

## Known Limitations (MVP)

- No email/SMS notifications to parents (staff-only system by design)
- No public parent portal
- No online payment gateway (manual fee recording only)
- File storage is local — back up `storage/uploads/` regularly
- Single-campus seat tracking (multi-campus supported in schema)
- No review/waitlist workflow
