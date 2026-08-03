# Bot module

Owns chat-provider integration and user-facing message construction.

## Boundaries

- Domain logic belongs in `src/modules/`, not Telegram controllers or adapters.
- Telegram-specific payloads should not leak into domain services.
- Outbound Telegram calls go through the chat-provider abstraction.
- Commands should delegate to services or presenters.
- User-facing text should be created by message factories or presenters.

See [`../../docs/constitution/tech-stack.md`](../../docs/constitution/tech-stack.md).
