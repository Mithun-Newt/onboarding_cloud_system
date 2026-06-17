#!/bin/sh
set -e

echo "Starting deployment checks..."

echo "Running Prisma migrations..."
npx --no-install prisma migrate deploy

echo "Running Database seeds..."
npx --no-install tsx prisma/seed.ts

echo "Starting Next.js application..."
exec "$@"
