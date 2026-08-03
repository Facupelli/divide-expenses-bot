# AI module

Interprets natural-language messages and maps them to application operations.

## Invariants

- Isolate history by chat ID and keep it bounded.
- Validate parsed tool arguments before calling presenters.
- Treat model output as untrusted input.
- Keep OpenAI-specific code inside the adapter.
- Ensure `prompt.txt` is included in every deployment artifact.
- Do not make financial calculations in prompts when deterministic domain code can do so.
