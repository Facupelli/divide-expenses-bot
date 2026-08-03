# Group module

Owns the lifecycle of expense groups associated with Telegram chats.

## Responsibilities

- Create a group.
- Find the active group for a chat.
- Close an active group.
- List or verify group participants.

## Invariants

- A chat has at most one active group.
- All group lookups are scoped by chat ID.
- Closing a group preserves its historical data.
- Membership checks must target the active group.
- Concurrency must not allow two active groups for one chat.

Persistence is defined by `group.repository.ts` and implemented by `group.sqlite.repository.ts`.
