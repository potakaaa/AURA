# AURA AI Engine

Prompt and context assembly utilities for AURA's LLM reasoning pipeline.

## What this package contains

- `prompts/system.ts` - Core system prompt that defines AURA persona, constraints, and tool-use behavior.
- `prompts/tools.ts` - Claude tool definitions for the MVP tool set.
- `prompts/formats.ts` - JSON schemas for structured outputs (`action_plan`, `summary`, `confirmation`).
- `context/window.ts` - Context window budgeting and assembly strategy for model calls.

## Prompt architecture

The prompt layer is split into four responsibilities:

1. **Identity and behavior (`system.ts`)**  
   Encodes stable assistant policy: tone, safety, tool gating, and output expectations.
2. **Action interfaces (`tools.ts`)**  
   Defines tool contracts with JSON schemas so tool calls are machine-validated.
3. **Response contracts (`formats.ts`)**  
   Defines strict response schemas for predictable parsing in backend orchestration.
4. **Runtime context assembly (`context/window.ts`)**  
   Builds a bounded message array from system prompt + user preferences + recent history + new user input.

## Token budget strategy

The package uses a target context budget of **8,000 tokens** per request.

- System prompt: `<= 2,000`
- User preferences: `<= 500`
- Response reserve: `1,200`
- Tool-turn reserve: `400`
- Remaining history budget: `8,000 - 2,000 - 500 - 1,200 - 400 = 3,900`

This keeps enough space for generation and tool loops while preserving recent conversation context.

## Context assembly flow

1. Add system prompt (`role: system`).
2. Serialize and trim user preferences to preference budget (`role: system`).
3. Keep newest history messages that fit history budget.
4. Append new user message (`role: user`).
5. Return usage metadata for logging and tuning.

## Claude API integration reference (W5)

Use exports from this package to build request payloads:

- `SYSTEM_PROMPT` as `system` input.
- `CLAUDE_TOOLS` as Claude tool registrations.
- `assembleContextWindow(...)` to compute bounded message history.
- `OUTPUT_FORMAT_SCHEMAS` to validate structured model output.

Example wiring shape:

```ts
import {
  SYSTEM_PROMPT,
  CLAUDE_TOOLS,
  assembleContextWindow,
  OUTPUT_FORMAT_SCHEMAS,
} from "ai-engine";
```

## Current MVP tool set

- `read_calendar`
- `create_event`
- `search_drive`
- `read_email`
- `execute_action`

Future W7 additions (such as `read_document` and `draft_reply`) should extend
`prompts/tools.ts` without changing existing tool contracts.

## Examples for prompt testing

See `prompts/examples/` for input/output fixtures used to regression-test:

- summaries
- tool selection
- confirmation previews
- clarification behavior
- multi-step action plans

