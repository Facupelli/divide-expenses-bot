# Agent guide

| Read | When |
|---|---|
| [`README.md`](README.md) | Product overview and supported behavior |
| [`docs/constitution/mission.md`](docs/constitution/mission.md) | Product goals, priorities, and boundaries |
| [`docs/constitution/tech-stack.md`](docs/constitution/tech-stack.md) | Architecture, runtime, dependencies, and engineering rules |
| [`src/bot/README.md`](src/bot/README.md) | Chat abstraction, Telegram integration, commands, and messages |
| [`src/webhook/README.md`](src/webhook/README.md) | HTTP ingestion, queueing, workers, and message dispatch |
| [`src/modules/README.md`](src/modules/README.md) | Domain modules and dependency direction |
| [`src/db/README.md`](src/db/README.md) | Schema, persistence, and migrations |

## Required workflow

| Step | Command or rule |
|---|---|
| Install | `npm ci` |
| Build | `npm run build` |
| Lint and format check | `npx biome check src` |
| Run locally | `npm run dev` |
| Database changes | Update `src/db/schema.ts` and generate a Drizzle migration |
| Verification | Add tests for changed behavior, then run build, lint, and tests |

Preserve message ordering, monetary correctness, database integrity, and separation between domain logic and external providers.
