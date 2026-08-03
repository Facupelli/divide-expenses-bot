# UX and Product Audit

**Date:** August 3, 2026  
**Scope:** Initial end-to-end audit using Telegram, a public development tunnel, Redis, and an isolated SQLite database

## Executive summary

The core settlement calculations correctly account for the participants assigned to each expense. The primary issue is that the bot explains those calculations inaccurately when expenses have different participant sets.

The audit also uncovered a critical integrity problem: if sending a Telegram response fails after an expense has been persisted, BullMQ retries the entire job and can register the expense again.

No production data or source code was modified during the audit. The production webhook was restored after testing.

## Critical priority

### 1. Job retries can duplicate expenses

#### Reproduction

1. Send one message containing two expenses.
2. The application saves both expenses successfully.
3. Sending the confirmation to Telegram times out.
4. BullMQ retries the complete job.
5. The application saves both expenses again.

The isolated database contained:

```text
Pelli  $6,000  accommodation
Waldo  $4,000  tickets
Pelli  $6,000  accommodation
Waldo  $4,000  tickets
```

#### Impact

A temporary network failure can permanently corrupt the group balance. The user may not receive any indication that the expenses were registered more than once.

#### Recommendation

- Persist Telegram's `update_id` and enforce uniqueness.
- Make webhook processing idempotent.
- Separate domain processing from response delivery retries.
- Do not execute an already completed side effect again.
- Introduce idempotency keys for expense creation.
- Save multiple expenses in a single database transaction.

### 2. "Per person" is incorrect when expenses have different participant sets

#### Reproduction

- Pelli pays $6,000, split among all six members.
- Waldo pays $4,000, split only among Waldo, Ana, Beto, and Carla.

The settlement summary displays:

```text
Total: $10,000
Per person: $1,667
```

That value comes from dividing the total by all six group members. However, nobody's actual accumulated share is $1,666.67:

- Pelli: $1,000
- Waldo: $2,000
- Ana: $2,000
- Beto: $2,000
- Carla: $2,000
- Diego: $1,000

The settlement transactions are calculated from the correct balances, but the summary is misleading.

#### Recommendation

Remove the global "Per person" value when expenses do not have identical participant sets. A more useful presentation would be:

```text
💸 Group balance

Total expenses: $10,000

Accumulated share:
- Pelli: $1,000
- Waldo: $2,000
- Ana: $2,000
- Beto: $2,000
- Carla: $2,000
- Diego: $1,000

To settle:
...
```

## High priority

### 3. Confirmations and expense history omit the split

The current confirmation says:

```text
✅ Expense registered
👤 Waldo paid 💰 $4,000
📝 for: tickets
```

It does not say that the expense applies only to Waldo, Ana, Beto, and Carla. The expense history also omits participants and individual shares.

#### Recommendation

```text
✅ Expense registered

🎟 Tickets: $4,000
Paid by: Waldo
Split among: Waldo, Ana, Beto, and Carla
Individual share: $1,000
```

For repeating decimal shares, avoid displaying an unexplained rounded value. For example:

```text
Approximate individual share: $33.33
The remaining cent will be compensated in the final settlement.
```

### 4. Monetary formatting hides all cents

`formatAmount()` currently sets:

```ts
maximumFractionDigits: 0
```

An internal debt of $2,033.33 is therefore displayed as $2,033. Other movements may be rounded in the opposite direction, making it impossible for the user to verify that the displayed transfers balance.

This conflicts with the agreed policy of maintaining fairness to the cent, even though everyday expenses in Argentina are generally entered in whole pesos.

#### Recommendation

- Represent monetary values as integer cents.
- Avoid binary floating-point arithmetic for money.
- Preserve sufficient precision while calculating individual shares.
- Accumulate balances before rounding.
- Round only the final settlement transfers to cents.
- Allocate unavoidable residual cents deterministically.
- Display two decimal places only when the amount contains cents.

Examples using Argentine formatting:

```text
$7.893
$33,33
$2.033,34
```

### 5. `/start` is not implemented and is sent to OpenAI

The `/start` message was treated as ordinary natural-language input because no matching command is registered. Its response was significantly delayed by an OpenAI timeout and retry.

#### Recommendation

Implement the following commands locally without using AI:

- `/start`
- `/ayuda`
- `/ver_gastos`
- `/ajuste_cuentas`
- `/cerrar_grupo`

`/start` should briefly explain the bot's purpose and show realistic examples.

### 6. Slow requests block every conversation

The worker has a global concurrency of one. A slow or timed-out OpenAI request blocks all subsequent messages, including messages from unrelated chats.

#### Recommendation

- Preserve sequential processing per chat rather than globally.
- Process independent chats concurrently.
- Use shorter and explicit provider timeouts.
- Notify users when processing is taking longer than expected.
- Ensure retries cannot repeat completed domain operations.

## Medium priority

### 7. There is no confirmation before persistence

The product documentation says parsed expenses are confirmed before they are saved, but the current implementation saves them immediately.

This is particularly risky for AI interpretation and messages containing multiple expenses.

#### Recommended flow

```text
I understood the following:

1. Accommodation: $6,000
   Paid by Pelli
   Split among all six members

2. Tickets: $4,000
   Paid by Waldo
   Split among Waldo, Ana, Beto, and Carla

Register these expenses?
[Confirm] [Correct] [Cancel]
```

Telegram inline buttons would be preferable to relying entirely on free-form replies.

### 8. Users cannot correct registered expenses

After an expense is registered, users cannot:

- Edit it.
- Delete it.
- Change its participants.
- Change its payer.
- Correct its amount or description.

Editing and deleting expenses are fundamental capabilities in established expense-sharing products.

### 9. Registering multiple expenses is not atomic

Expenses are persisted one at a time without a database transaction. If the second expense fails, the first remains saved even though the user receives a general failure response.

A multi-expense operation should save everything or nothing.

### 10. The domain layer does not explicitly validate every participant

The service verifies that each payer belongs to the active group, but it does not explicitly validate every member of `splitBetween`.

The application currently depends on:

- The AI provider producing valid participant names.
- A database foreign-key constraint rejecting invalid data.

A failure can produce a generic error and leave a multi-expense operation partially persisted.

### 11. Dates are inconsistent and not user-friendly

Expense confirmations display a technical UTC timestamp:

```text
2026-08-03T16:58:28.000Z
```

Expense history attempts to use human-readable values such as `Today 13:58`. All user-facing surfaces should use a consistent Argentine local format, such as:

```text
Today, 13:58
Aug 3, 13:58
```

The Spanish UI should use the equivalent localized wording and month names.

### 12. Telegram integration errors can be reported as successes

The administrative webhook endpoint returned HTTP 201 even though Telegram rejected the supplied webhook URL. Some Telegram adapter methods parse the API response but do not verify its `ok` field.

This can produce false success responses when configuring:

- The webhook.
- Bot commands.
- The bot name.
- Outbound messages.

## Minor UX issues

- A Spanish error message contains the typo `persibas` instead of `personas`.
- Empty expense history can display only a heading without an explanation.
- A settlement with no outstanding debts lacks a clear empty state.
- Multi-expense confirmations omit participants.
- Message hierarchy and formatting are inconsistent across bot responses.
- There is no quick way to list current group members.
- There is no guidance showing how to specify a subset of participants.
- Closing a group does not request confirmation.
- Commands with a bot username suffix in group chats, such as `/ver_gastos@BotName`, may not be recognized.
- AI conversation history exists only in process memory and disappears after a restart.
- AI history is organized by chat rather than by an explicit pending interaction, which can mix corrections or concurrent flows.

## Product improvements based on comparable expense-sharing tools

### Essential

1. Confirm, correct, or cancel interpreted expenses before saving.
2. Edit and delete expenses.
3. Show participants and individual shares for every expense.
4. Mark settlement transfers as paid.
5. Add or remove group participants.
6. Keep an expense change history.
7. Provide `/start` and `/ayuda` commands with examples.

### Valuable later

- Percentage-based and custom-amount splits.
- Expense categories.
- Notes and receipt photos.
- CSV export.
- Per-person summaries.
- Search and filters.
- Configurable currencies for travel.
- Shareable final summaries.
- Reopening closed groups.
- Tracking who has confirmed or completed settlement payments.

## Technical verification

| Check | Result |
|---|---|
| `npm run build` | Passed |
| `npx biome check src` | Failed with 3 errors and 83 warnings |
| Automated test suite | Not configured |
| Isolated SQLite migrations | Passed |
| Redis and public tunnel | Operational during testing |
| Production webhook | Restored after testing |
| Source code modified | No |

## Recommended implementation order

1. Idempotency and duplicate prevention.
2. Precise monetary model.
3. Correct summaries and messages for participant subsets.
4. Database transactions for multi-expense registration.
5. Confirmation before persistence.
6. Editing and deleting expenses.
7. Local `/start` and `/ayuda` commands.
8. Independent concurrency per chat.
9. Error handling and empty states.
10. General message and date presentation improvements.
