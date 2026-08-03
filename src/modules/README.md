# Domain modules

The modules directory contains application and domain behavior.

| Module | Responsibility | Documentation |
|---|---|---|
| `ai` | Natural-language interpretation and tool dispatch | [`ai/README.md`](ai/README.md) |
| `group` | Active group lifecycle and membership queries | [`group/README.md`](group/README.md) |
| `user` | Participant creation and presentation | [`user/README.md`](user/README.md) |
| `expense` | Expense recording, presentation, and settlement | [`expense/README.md`](expense/README.md) |

## Dependency rules

- Services express business behavior.
- Presenters translate results into user-facing responses.
- Repository interfaces define persistence requirements.
- SQLite repositories implement those interfaces.
- Modules must not depend directly on Express, BullMQ, or Telegram APIs.
- AI tool calls must enter domain behavior through validated application interfaces.
