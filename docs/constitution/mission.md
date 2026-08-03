# Mission

## Purpose

Divide Expenses Bot makes shared-expense tracking simple inside a Telegram conversation. A group should be able to describe spending naturally and receive an accurate, understandable settlement without maintaining a separate spreadsheet.

## Users

The primary users are small groups sharing costs during trips, dinners, events, or recurring activities.

## Product principles

1. **Correctness before convenience**  
   Expenses, participants, balances, and settlements must be reliable. Never silently invent, discard, or reinterpret financial data.

2. **Conversation over forms**  
   Natural-language interaction is the primary experience, while explicit commands remain available for predictable operations.

3. **Confirm ambiguity**  
   When payer, amount, participants, or intent is unclear, ask for clarification rather than guessing.

4. **Transparent outcomes**  
   Users should be able to review recorded expenses and understand who owes whom.

5. **Group isolation**  
   Data and conversational context from one Telegram chat must never affect another.

6. **Ordered processing**  
   Messages from the same chat must be processed in their original order.

7. **Replaceable integrations**  
   Expense and group behavior should not depend directly on Telegram, OpenAI, Redis, or SQLite APIs.

## Current scope

- Create and close an expense group.
- Add participants.
- Record one or more expenses from natural language.
- List recorded expenses.
- Calculate settlement transactions.
- Persist expense data.
- Process Telegram updates asynchronously.
