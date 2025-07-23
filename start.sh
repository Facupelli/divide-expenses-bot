set -e
echo "Running database migrations…"
npx drizzle-kit migrate --config=/app/src/drizzle.config.ts
echo "Starting application…"
exec node dist/index.js
