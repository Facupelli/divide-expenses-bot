# User module

Owns participants within an expense group.

## Responsibilities

- Add participants to the active group.
- Retrieve participants for a chat.
- Convert domain outcomes into user-facing messages.

## Invariants

- Participant names are unique within a group.
- A participant belongs to a specific group, not globally to a chat.
- Adding participants requires an active group or creates one only when explicitly defined by the product flow.
- Input names must be validated and normalized consistently.

Persistence is defined by `user.repository.ts` and implemented by `user.sqlite.repository.ts`.
