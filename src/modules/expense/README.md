# Expense module

Owns expense recording, listing, formatting, and settlement calculation.

## Responsibilities

- Validate and save one or more expenses.
- Associate each expense with its split participants.
- List expenses for the active group.
- Calculate balances and settlement transactions.
- Present outcomes as user-facing messages.

## Invariants

- Every expense belongs to one group.
- The payer and all split participants belong to that group.
- Amounts are positive integers in the documented smallest monetary unit.
- An expense has at least one split participant.
- Multi-expense writes are atomic.
- Settlement balances sum to zero, subject only to explicit rounding rules.
- Calculations are deterministic and independent of AI output.

Persistence is defined by `expense.repository.ts` and implemented by `expense.sqlite.repository.ts`.
