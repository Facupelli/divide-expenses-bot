#!/bin/sh
set -e

echo "Running database migrations…"
tsx /app/src/drizzle.config.ts migrate

echo "Starting application…"
exec node dist/index.js
