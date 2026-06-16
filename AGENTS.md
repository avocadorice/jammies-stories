# jammies-stories

This project was bootstrapped from [agy-template](file:///Users/bhsiao/dev/gdrive/agy-template).

## Goal
(To be defined)

## Stack
(To be defined)

## What's included

- **Auto-logging hooks** — every prompt and the agent's final response are appended to `logs/session.log` automatically via Antigravity workspace-level lifecycle hooks.
- **`new-project` skill** — the agent can interactively walk you through bootstrapping a new project when you ask to create/bootstrap a new project.

## Session log

`logs/session.log` is updated automatically via hooks configured in `.agents/hooks.json`:
- **`PreInvocation`** (runs `log-prompt.py`): Logs your prompt.
- **`Stop`** (runs `log-session-end.py`): Captures the last response from the transcript and appends it.

Use this to review what was discussed across sessions without re-reading full transcripts.

