# Webhook module

Accepts Telegram updates and coordinates asynchronous processing.

## Flow

```text
Telegram webhook
  -> route and validation
  -> controller and rate limiter
  -> BullMQ queue
  -> Telegram worker
  -> processor
  -> WebhookService
  -> command or AI flow
```

## Invariants

- Acknowledge valid webhook requests quickly.
- Preserve message order within a chat.
- Avoid duplicate processing when Telegram retries an update.
- Do not perform domain work directly in controllers.
- Make job failures observable and safe to retry.

See [`../../docs/constitution/tech-stack.md`](../../docs/constitution/tech-stack.md).
