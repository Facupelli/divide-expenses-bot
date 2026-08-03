# UX and Product Audit TODO

Source: [UX and Product Audit - August 3, 2026](2026-08-03-ux-product-audit.md)

This checklist tracks all findings and product improvements from the audit. Completed items reflect the implementation status reported after the audit, not the status recorded during the original audit.

## Completed priorities

- [x] [1. Prevent job retries from duplicating expenses](2026-08-03-ux-product-audit.md#1-job-retries-can-duplicate-expenses)
- [x] [2. Correct summaries when expenses have different participant sets](2026-08-03-ux-product-audit.md#2-per-person-is-incorrect-when-expenses-have-different-participant-sets)
- [x] [3. Show split details in confirmations and expense history](2026-08-03-ux-product-audit.md#3-confirmations-and-expense-history-omit-the-split)
- [x] [4. Preserve and display monetary precision](2026-08-03-ux-product-audit.md#4-monetary-formatting-hides-all-cents)
- [x] [5. Handle `/start` and documented commands locally](2026-08-03-ux-product-audit.md#5-start-is-not-implemented-and-is-sent-to-openai)
- [x] [6. Process independent conversations concurrently](2026-08-03-ux-product-audit.md#6-slow-requests-block-every-conversation)

## Medium priority

### [7. Confirm interpreted expenses before persistence](2026-08-03-ux-product-audit.md#7-there-is-no-confirmation-before-persistence)

- [ ] Present all interpreted expenses before saving them.
- [ ] Show the description, amount, payer, participants, and split for each expense.
- [ ] Provide Telegram inline actions to confirm, correct, or cancel.
- [ ] Persist expenses only after explicit confirmation.
- [ ] Ensure cancellation leaves no persisted expenses.
- [ ] Define expiration and stale-button behavior for pending confirmations.
- [ ] Add automated tests for single-expense, multi-expense, correction, cancellation, expiration, and duplicate-callback flows.

### [8. Allow users to correct registered expenses](2026-08-03-ux-product-audit.md#8-users-cannot-correct-registered-expenses)

- [ ] Allow an expense description to be edited.
- [ ] Allow an expense amount to be edited.
- [ ] Allow the payer to be changed.
- [ ] Allow participants to be changed.
- [ ] Allow an expense to be deleted.
- [ ] Recalculate balances and settlements after every change.
- [ ] Require confirmation before destructive actions.
- [ ] Add authorization and closed-group behavior tests.

### [9. Make multi-expense registration atomic](2026-08-03-ux-product-audit.md#9-registering-multiple-expenses-is-not-atomic)

- [ ] Save all expenses from one confirmed operation in a single database transaction.
- [ ] Roll back the entire operation if any expense fails validation or persistence.
- [ ] Preserve idempotency when a transaction or response delivery is retried.
- [ ] Add an integration test that forces a failure after the first expense.

### [10. Validate every expense participant in the domain layer](2026-08-03-ux-product-audit.md#10-the-domain-layer-does-not-explicitly-validate-every-participant)

- [ ] Validate the payer against the active group's members.
- [ ] Validate every member of `splitBetween` against the active group's members.
- [ ] Reject empty and duplicate participant lists.
- [ ] Return a specific, user-friendly validation error.
- [ ] Validate all expenses before starting a multi-expense transaction.
- [ ] Add domain tests for unknown, duplicate, and missing participants.

### [11. Make user-facing dates consistent and local](2026-08-03-ux-product-audit.md#11-dates-are-inconsistent-and-not-user-friendly)

- [ ] Define the product's timezone policy.
- [ ] Format all user-facing dates in the Argentine local timezone.
- [ ] Localize relative labels, month names, and time formatting.
- [ ] Use the same date presentation in confirmations, history, and summaries.
- [ ] Add tests around midnight, month boundaries, and daylight-saving assumptions.

### [12. Reject false successes from Telegram](2026-08-03-ux-product-audit.md#12-telegram-integration-errors-can-be-reported-as-successes)

- [ ] Validate Telegram's HTTP status and response `ok` field for every adapter operation.
- [ ] Preserve Telegram's error code and description in application errors and logs.
- [ ] Return failure from administrative endpoints when Telegram rejects an operation.
- [ ] Cover webhook, command, bot-name, and outbound-message operations.
- [ ] Add adapter tests for HTTP errors and HTTP 200 responses containing `ok: false`.

## Minor UX issues

Source: [Minor UX issues](2026-08-03-ux-product-audit.md#minor-ux-issues)

- [x] Fix the Spanish typo `persibas` to `personas`.
- [ ] Show a helpful empty state when no expenses have been registered.
- [ ] Show a clear no-debts state when the group is settled.
- [ ] Verify that multi-expense confirmations show participants consistently.
- [ ] Standardize message hierarchy and formatting across bot responses.
- [ ] Add a quick way to list current group members.
- [ ] Explain how to specify a subset of participants.
- [ ] Request confirmation before closing a group.
- [ ] Recognize commands with a bot username suffix, such as `/ver_gastos@BotName`.
- [ ] Persist pending AI interaction state across process restarts.
- [ ] Scope AI history to explicit pending interactions so corrections and concurrent flows cannot mix.

## Essential product improvements

Source: [Essential improvements](2026-08-03-ux-product-audit.md#essential)

Items already represented above should be completed through their primary task rather than implemented twice.

- [ ] Confirm, correct, or cancel interpreted expenses before saving. See [task 7](#7-confirm-interpreted-expenses-before-persistence).
- [ ] Edit and delete expenses. See [task 8](#8-allow-users-to-correct-registered-expenses).
- [x] Show participants and individual shares for every expense. See [completed priority 3](#completed-priorities).
- [ ] Allow settlement transfers to be marked as paid.
- [ ] Allow group participants to be added or removed safely.
- [ ] Keep an immutable expense change history for edits and deletions.
- [x] Provide `/start` and `/ayuda` commands with realistic examples. See [completed priority 5](#completed-priorities).

## Valuable later

Source: [Valuable later improvements](2026-08-03-ux-product-audit.md#valuable-later)

- [ ] Support percentage-based splits.
- [ ] Support custom-amount splits.
- [ ] Add expense categories.
- [ ] Add notes and receipt photos.
- [ ] Export expenses and settlements as CSV.
- [ ] Add per-person summaries.
- [ ] Add expense search and filters.
- [ ] Support configurable currencies for travel.
- [ ] Create shareable final summaries.
- [ ] Allow closed groups to be reopened safely.
- [ ] Track who has confirmed or completed settlement payments.

## Cross-cutting completion criteria

Apply these checks to every implementation task:

- [ ] Add or update automated tests for changed behavior.
- [ ] Verify database migrations against a fresh and an existing database when the schema changes.
- [ ] Preserve per-chat message ordering and cross-chat concurrency.
- [ ] Preserve idempotency and avoid repeating completed side effects.
- [ ] Verify monetary calculations and displayed totals to the cent.
- [ ] Run `npm run build`.
- [ ] Run `npx biome check src`.
- [ ] Run the complete automated test suite.
- [ ] Exercise the affected flow end to end through Telegram.
