#!/bin/sh
set -e

echo "Starting deployment checks..."

# Note: The database schema, views, and initial seed data are automatically 
# created by PostgreSQL using the database/init.sql initialization script 
# mounted in docker-compose.yml.

echo "Starting Next.js application..."
exec "$@"
