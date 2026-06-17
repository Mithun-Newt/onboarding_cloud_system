#!/bin/sh
set -e

echo "Starting deployment checks..."

echo "Running Prisma migrations..."
prisma migrate deploy

echo "Running Database seeds..."
tsx prisma/seed.ts

echo "Starting Next.js application..."
exec "$@"
