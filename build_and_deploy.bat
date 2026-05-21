@echo off
SETLOCAL

echo ==============================================
echo  Junior School Admissions System - Deployer
echo ==============================================

:: Check Docker
docker info >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)

:: Copy .env if not present
IF NOT EXIST .env (
    IF EXIST .env.example (
        copy .env.example .env
        echo [WARN] Copied .env.example to .env. Please edit .env and set NEXTAUTH_SECRET before running in production.
    ) ELSE (
        echo [ERROR] No .env file found. Create one from .env.example.
        exit /b 1
    )
)

:: Parse argument
SET ACTION=%1
IF "%ACTION%"=="" SET ACTION=start

IF "%ACTION%"=="build" GOTO BUILD
IF "%ACTION%"=="start" GOTO START
IF "%ACTION%"=="seed" GOTO SEED
IF "%ACTION%"=="stop" GOTO STOP
IF "%ACTION%"=="logs" GOTO LOGS
IF "%ACTION%"=="migrate" GOTO MIGRATE

echo Usage: build_and_deploy.bat [build^|start^|seed^|migrate^|stop^|logs]
exit /b 0

:BUILD
echo [INFO] Building Docker images...
docker compose -f docker-compose.local.yml build --no-cache
echo [OK] Build complete.
GOTO END

:START
echo [INFO] Starting services...
docker compose -f docker-compose.local.yml up -d
echo [INFO] Waiting for database to be ready...
timeout /t 10 /nobreak >nul
echo [INFO] Running migrations...
docker exec school_app npx prisma migrate deploy
echo.
echo [OK] Application is running at http://localhost:3000
echo [OK] Default login: username=admin  password=Admin@12345
echo [WARN] Change the default password immediately after first login!
GOTO END

:SEED
echo [INFO] Starting services...
docker compose -f docker-compose.local.yml up -d
timeout /t 10 /nobreak >nul
echo [INFO] Running migrations...
docker exec school_app npx prisma migrate deploy
echo [INFO] Seeding database...
docker exec school_app npx tsx prisma/seed.ts
echo.
echo [OK] Database seeded. Application at http://localhost:3000
echo [OK] Default login: username=admin  password=Admin@12345
echo [WARN] Change the default password immediately!
GOTO END

:MIGRATE
echo [INFO] Running database migrations...
docker exec school_app npx prisma migrate deploy
echo [OK] Migrations complete.
GOTO END

:STOP
echo [INFO] Stopping services...
docker compose -f docker-compose.local.yml down
echo [OK] Services stopped.
GOTO END

:LOGS
docker compose -f docker-compose.local.yml logs -f
GOTO END

:END
ENDLOCAL
