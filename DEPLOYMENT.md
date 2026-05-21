# Deployment Guide — Junior School Admissions System

This guide covers every scenario for building, deploying, and running the application.

| Scenario | Best for |
|----------|----------|
| [Option A — Docker Compose](#option-a-docker-compose-recommended) | Production / school LAN server (recommended) |
| [Option B — Without Docker](#option-b-without-docker-existing-postgresql) | Dev machine or server where Docker isn't available |
| [Option C — Windows Auto-start](#option-c-windows-auto-start-no-docker) | Run as a background service on Windows without Docker |

---

## Prerequisites

### Option A (Docker)

| Software | Minimum Version | Download |
|----------|----------------|----------|
| Docker Desktop (Windows) | 4.x | https://www.docker.com/products/docker-desktop/ |
| Git | any | https://git-scm.com/ |

That's it — Docker packages Node.js and PostgreSQL automatically.

### Option B / C (No Docker)

| Software | Minimum Version | Download |
|----------|----------------|----------|
| Node.js | 20 LTS | https://nodejs.org/ |
| PostgreSQL | 14 or newer | https://www.postgresql.org/download/windows/ |
| Git | any | https://git-scm.com/ |

---

## Step 1 — Clone the Repository

Open **Command Prompt** or **PowerShell** on the server machine:

```bat
git clone <your-repo-url> C:\SchoolApp
cd C:\SchoolApp
```

> Replace `<your-repo-url>` with the actual Git remote URL.

---

## Step 2 — Configure Environment

Copy the example environment file:

```bat
copy .env.example .env
```

Open `.env` in Notepad and fill in every value:

```ini
# ── Database ──────────────────────────────────────────────────────────────────
# Docker:   leave as-is (Docker sets this automatically from docker-compose)
# No Docker: point to your PostgreSQL instance
DATABASE_URL="postgresql://postgres:YourPassword@localhost:5432/school_admissions"

# ── NextAuth ──────────────────────────────────────────────────────────────────
# NEXTAUTH_URL must be the URL that browsers use to reach the app.
# Use the server's LAN IP so other computers on the network can log in.
NEXTAUTH_URL="http://192.168.1.100:3000"

# Generate a strong secret (run once):
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET="paste-your-generated-secret-here"

# ── File uploads ──────────────────────────────────────────────────────────────
UPLOAD_DIR="./storage/uploads"
MAX_FILE_SIZE_MB=10

# ── Branding ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="Junior School Admissions System"
NEXT_PUBLIC_SCHOOL_NAME="Your School Name"
```

> **NEXTAUTH_URL tip:** Open Command Prompt and run `ipconfig`. Use the IPv4 address shown under your network adapter (e.g., `192.168.1.100`). Do NOT use `localhost` if other staff computers need to access the system.

---

## Option A — Docker Compose (Recommended)

Docker runs both the app and PostgreSQL in isolated containers. No manual database setup required.

### First-time setup

```bat
cd C:\SchoolApp

:: 1. Build the Docker image (takes 3–5 minutes on first run)
build_and_deploy.bat build

:: 2. Start services + run migrations + seed the database
build_and_deploy.bat seed
```

When complete you will see:
```
[OK] Database seeded. Application at http://localhost:3000
[OK] Default login: username=admin  password=Admin@12345
[WARN] Change the default password immediately!
```

Open a browser and go to `http://localhost:3000` (or `http://<server-ip>:3000` from another machine).

### Daily operations

| Task | Command |
|------|---------|
| Start the app | `build_and_deploy.bat start` |
| Stop the app | `build_and_deploy.bat stop` |
| View live logs | `build_and_deploy.bat logs` |
| Apply DB migrations (after upgrade) | `build_and_deploy.bat migrate` |
| Rebuild after code change | `build_and_deploy.bat build` then `build_and_deploy.bat start` |

### How it works internally

```
build_and_deploy.bat build
  └─► docker compose build --no-cache
        └─► Dockerfile (3-stage: deps → builder → runner)

build_and_deploy.bat start / seed
  └─► docker compose up -d
        ├─► school_db  (postgres:16-alpine, port 5432)
        └─► school_app (Next.js standalone, port 3000)
              └─► Waits for DB healthcheck before starting
```

---

## Option B — Without Docker (Existing PostgreSQL)

Use this when PostgreSQL is already installed on the machine (or on another server on the network).

### 1. Create the database

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE school_admissions;
```

### 2. Run the initialization script

This creates all tables, indexes, views, and seeds reference data in one step:

```bat
cd C:\SchoolApp
psql -U postgres -d school_admissions -f database\init.sql
```

If `psql` is not in your PATH, use the full path:

```bat
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d school_admissions -f database\init.sql
```

You should see output ending with `COMMIT` — that confirms success. Verify with the query at the bottom of `init.sql` (uncomment it if needed).

### 3. Update .env

Make sure `DATABASE_URL` in your `.env` points to the database:

```ini
DATABASE_URL="postgresql://postgres:YourPassword@localhost:5432/school_admissions"
```

### 4. Install dependencies and generate Prisma client

```bat
cd C:\SchoolApp
npm install
npm run db:generate
```

### 5. Build the application

```bat
npm run build
```

This produces an optimized production build in `.next/`.

### 6. Start the application

```bat
npm run start
```

The app will be available at the `NEXTAUTH_URL` you configured. Keep this terminal window open (or use Option C below to run it as a background service).

To run on a specific port (default is 3000):

```bat
set PORT=3000
npm run start
```

---

## Option C — Windows Auto-start (No Docker)

Run the app as a Windows background service so it starts automatically when the server boots.

### Using NSSM (Non-Sucking Service Manager)

1. Download NSSM from https://nssm.cc/download — extract `nssm.exe` to `C:\SchoolApp\tools\`

2. Open **Command Prompt as Administrator** and install the service:

```bat
C:\SchoolApp\tools\nssm.exe install SchoolAdmissions

:: Fill in the dialog that opens:
::   Path        : C:\Program Files\nodejs\node.exe
::   Startup dir : C:\SchoolApp
::   Arguments   : node_modules\.bin\next start
```

Or do it non-interactively:

```bat
C:\SchoolApp\tools\nssm.exe install SchoolAdmissions "C:\Program Files\nodejs\node.exe"
C:\SchoolApp\tools\nssm.exe set SchoolAdmissions AppDirectory "C:\SchoolApp"
C:\SchoolApp\tools\nssm.exe set SchoolAdmissions AppParameters "node_modules\.bin\next start"
C:\SchoolApp\tools\nssm.exe set SchoolAdmissions AppEnvironmentExtra "NODE_ENV=production"
C:\SchoolApp\tools\nssm.exe set SchoolAdmissions Start SERVICE_AUTO_START
C:\SchoolApp\tools\nssm.exe start SchoolAdmissions
```

3. Manage the service:

```bat
:: Start
C:\SchoolApp\tools\nssm.exe start SchoolAdmissions

:: Stop
C:\SchoolApp\tools\nssm.exe stop SchoolAdmissions

:: Remove
C:\SchoolApp\tools\nssm.exe remove SchoolAdmissions confirm
```

> Make sure you have completed **Option B steps 1–5** before installing the service.

---

## First Login

| Field | Value |
|-------|-------|
| URL | `http://<server-ip>:3000` |
| Username | `admin` |
| Password | `Admin@12345` |

> **You will be forced to change the password on first login.** Do this before sharing the system with any other staff member.

---

## Creating Additional Staff Users

1. Log in as `admin`
2. Go to **Settings → Staff Users**
3. Click **Add User** and assign one or more roles

| Role | Access |
|------|--------|
| SYSTEM_ADMIN | Everything — full system access |
| VICE_PRINCIPAL | All admissions + all reports |
| ADMISSION_STAFF | Create / edit registrations and admissions |
| CASHIER | Record fee payments |
| DOCUMENT_VERIFIER | Upload and verify documents |
| TRANSPORT_STAFF | Manage transport assignments |
| READ_ONLY_MANAGEMENT | View all data and reports — no edits |

---

## Making the System Available on the School LAN

1. Confirm the server's IP address (`ipconfig` → IPv4 address), e.g., `192.168.1.100`
2. Set `NEXTAUTH_URL=http://192.168.1.100:3000` in `.env`
3. Allow inbound TCP port 3000 in Windows Firewall:

```bat
:: Run as Administrator
netsh advfirewall firewall add rule name="School Admissions App" dir=in action=allow protocol=TCP localport=3000
```

4. Staff on any computer on the same network open: `http://192.168.1.100:3000`

---

## Upgrading to a New Version

### Docker

```bat
cd C:\SchoolApp

:: Pull latest code
git pull

:: Rebuild and restart (data volumes are preserved)
build_and_deploy.bat build
build_and_deploy.bat migrate
build_and_deploy.bat start
```

### No Docker

```bat
cd C:\SchoolApp

:: Pull latest code
git pull

:: Reinstall dependencies if package.json changed
npm install

:: Regenerate Prisma client
npm run db:generate

:: Apply any new DB schema changes using the init script (idempotent)
psql -U postgres -d school_admissions -f database\init.sql

:: Rebuild
npm run build

:: Restart the app (stop the running process first, then)
npm run start
```

---

## Backup & Restore

### Backup the database

**Docker:**
```bat
docker exec school_db pg_dump -U postgres school_admissions > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

**No Docker (PostgreSQL installed locally):**
```bat
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres school_admissions > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

### Restore the database

**Docker:**
```bat
docker exec -i school_db psql -U postgres school_admissions < backup_20260601.sql
```

**No Docker:**
```bat
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d school_admissions < backup_20260601.sql
```

### Backup uploaded documents

Documents are stored in `storage/uploads/`. Copy this folder to a USB drive or network share regularly.

**Docker (copy from Docker volume):**
```bat
docker cp school_app:/app/storage/uploads ./uploads-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%
```

**No Docker:**
```bat
xcopy /E /I /Y storage\uploads uploads-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%
```

### Recommended backup schedule

| What | Frequency | Where to store |
|------|-----------|---------------|
| PostgreSQL dump | Daily (after close of business) | External USB / network share |
| `storage/uploads/` folder | Weekly | External USB / network share |

---

## Troubleshooting

### App does not start

**Check Docker containers are running:**
```bat
docker ps
```
All containers should show `Up`. If `school_db` shows `unhealthy`, wait 30 seconds and retry `build_and_deploy.bat start`.

**Check application logs:**
```bat
build_and_deploy.bat logs
:: or without Docker:
:: the terminal running "npm run start" shows all errors
```

---

### Cannot log in

**Verify the admin user exists:**

Docker:
```bat
docker exec school_db psql -U postgres school_admissions -c "SELECT username, is_active, must_change_password FROM staff_users;"
```

No Docker:
```bat
psql -U postgres -d school_admissions -c "SELECT username, is_active, must_change_password FROM staff_users;"
```

If the table is empty, re-run the seed:
- Docker: `build_and_deploy.bat seed`
- No Docker: `psql -U postgres -d school_admissions -f database\init.sql`

---

### Forgot admin password

Reset it using pgcrypto (same extension used during setup):

```sql
UPDATE staff_users
SET    password_hash        = crypt('NewPassword@123', gen_salt('bf', 12)),
       must_change_password = TRUE
WHERE  username = 'admin';
```

Run via Docker:
```bat
docker exec -it school_db psql -U postgres school_admissions
```

Run via psql (no Docker):
```bat
psql -U postgres -d school_admissions
```

---

### "Cannot connect to database"

1. Confirm PostgreSQL is running:
   - Docker: `docker ps` — `school_db` must be `Up`
   - No Docker: check Windows Services for `postgresql-x64-16`
2. Confirm `DATABASE_URL` in `.env` is correct
3. Confirm the database `school_admissions` exists

---

### File upload fails

1. Check `MAX_FILE_SIZE_MB` in `.env` (default 10)
2. Only **PDF, JPG, JPEG, PNG** files are accepted
3. Check that `storage/uploads/` exists and is writable:
   - Docker: the volume is managed automatically
   - No Docker: `mkdir storage\uploads` if the folder is missing

---

### Other machine on LAN gets "Site can't be reached"

1. Confirm `NEXTAUTH_URL` is set to the server's LAN IP (not `localhost`)
2. Confirm the firewall rule allows port 3000 (see [Making the system available on LAN](#making-the-system-available-on-the-school-lan))
3. Both machines must be on the same network (same Wi-Fi or same switch)

---

## Uninstalling

### Docker

```bat
:: Stop and remove containers + networks
build_and_deploy.bat stop

:: Also remove data volumes (DELETES ALL DATA — irreversible)
docker compose -f docker-compose.local.yml down -v

:: Remove the built image
docker rmi junior-school-admissions-app
```

### No Docker (NSSM service)

```bat
C:\SchoolApp\tools\nssm.exe stop SchoolAdmissions
C:\SchoolApp\tools\nssm.exe remove SchoolAdmissions confirm
```

Then drop the database in pgAdmin or psql:

```sql
DROP DATABASE school_admissions;
```

And delete the application folder:

```bat
rmdir /S /Q C:\SchoolApp
```

---

## Quick Reference Card

Print and keep at the server desk.

```
═══════════════════════════════════════════════════════
  Junior School Admissions System — Quick Reference
═══════════════════════════════════════════════════════

  Server folder : C:\SchoolApp
  App URL       : http://<server-ip>:3000
  Default login : admin / Admin@12345 (change immediately)

  ── Docker commands ────────────────────────────────
  Start          : build_and_deploy.bat start
  Stop           : build_and_deploy.bat stop
  View logs      : build_and_deploy.bat logs
  Rebuild        : build_and_deploy.bat build

  ── Database backup (run daily) ────────────────────
  docker exec school_db pg_dump -U postgres ^
    school_admissions > backup_YYYYMMDD.sql

  ── File backup (copy to USB weekly) ───────────────
  xcopy /E /I storage\uploads <USB-drive>\uploads-bkp

═══════════════════════════════════════════════════════
```
