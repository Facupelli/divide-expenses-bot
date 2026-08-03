# Technical constitution

## Runtime and tools

| Concern | Choice |
|---|---|
| Runtime | Node.js 20 or later |
| Language | TypeScript with strict type checking |
| HTTP | Express 5 |
| Chat provider | Telegram Bot API |
| AI provider | OpenAI Responses API with function tools |
| Database | SQLite through better-sqlite3 and Drizzle ORM |
| Validation | Zod and drizzle-zod |
| Queue | BullMQ backed by Redis |
| Dates | Day.js |
| Formatting and linting | Biome |
| Development runner | tsx |
| Deployment platform | Northflank |
| Deployment artifact | Multi-stage Docker image |

## Production deployment

Production runs on Northflank and consists of:

- A service running the Express application from the project's Docker image.
- A persistent volume named `sqlite-data` for the SQLite database.
- A Redis addon used by BullMQ for queueing and asynchronous message processing.

The application service connects to the persistent volume through `SQLITE_PATH` and to the Redis addon through `REDIS_MASTER_URL`.

## Runtime flow

1. Telegram sends an update to the Express webhook.
2. The HTTP layer validates the update and enqueues its message.
3. A BullMQ worker processes the message.
4. Explicit commands are dispatched through the command registry.
5. Other text is sent to the AI service.
6. AI tool calls invoke domain presenters and services.
7. Repositories persist data through Drizzle and SQLite.
8. The chat adapter sends the response to Telegram.

## Dependency direction

```text
HTTP / Telegram / OpenAI / Redis / SQLite
                 |
              adapters
                 |
       presenters and services
                 |
          repository contracts
```

Domain behavior must not import Express, Telegram HTTP APIs, OpenAI clients, BullMQ, or concrete database clients.

Composition belongs in `src/composition.ts`. Prefer constructor injection over module-level service lookup.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `OPENAI_API_KEY` | Yes | OpenAI authentication |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot authentication |
| `TELEGRAM_WEBHOOK_URL` | Yes | Public Telegram webhook URL |
| `REDIS_MASTER_URL` | Production | Redis connection URL |
| `SQLITE_PATH` | Production | SQLite database location |
| `API_KEY` | Yes for admin endpoints | Protect Telegram configuration routes |
| `PORT` | No | HTTP port, default `3000` |
| `NODE_ENV` | No | Runtime environment |
