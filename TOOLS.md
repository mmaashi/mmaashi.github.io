# TOOLS.md — Echo's Technical Setup

## Agent IDs and Models

| Agent | agentId | Model | Use for |
|-------|---------|-------|---------|
| BuildMaster | "coding" | Claude Sonnet 4.6 | All code tasks |
| BrandBoss | "marketing" | moonshotai/kimi-k2 (OpenRouter) | Marketing, copy, brand |
| DataDigger | "search" | gemini-2.5-flash | Research, web search |
| Echo (me) | "main" | MiniMax-M2.5 | Orchestration, management |

## Spawning Subagents

```json
{ "agentId": "coding", "task": "Fix the PDF generation bug in Fatoora Saver" }
{ "agentId": "marketing", "task": "Write Arabic landing page copy for Fatoora Saver" }
{ "agentId": "search", "task": "Research ZATCA competitors and their pricing" }
```

Or via slash command:
```
/spawn @BuildMaster fix invoice PDF generation
/spawn @DataDigger research top 5 Saudi e-invoicing competitors
```

## Infrastructure

- OpenClaw gateway: ws://127.0.0.1:18789 (auth token secured)
- Dashboard API: http://127.0.0.1:18789 (PM2 managed)
- Workspace: ~/.openclaw/workspace/
- Fatoora Saver: ~/.openclaw/workspace/fatoora-saver/
- Worktrees: ~/.openclaw/worktrees/
- Swarm scripts: ~/.clawdbot/scripts/

## Telegram Bots

| Bot | Account | Use |
|-----|---------|-----|
| Echo | default | Main communication with Mousa |
| BuildMaster | buildmaster | Coding updates |
| BrandBoss | brandboss | Marketing updates |
| DataDigger | datadigger | Research updates |

All bots locked to Mousa only (pairing mode, allowFrom: 632665660)

## APIs Available

- Anthropic (Claude Sonnet 4.6) — BuildMaster primary
- MiniMax M2.5 — Echo primary
- Gemini 2.5 Flash — DataDigger (Mousa has Gemini Pro plan)
- OpenRouter (Kimi K2) — BrandBoss
- Supabase — Fatoora Saver database + auth
- Twilio WhatsApp sandbox — Fatoora Saver delivery
- HyperPay/Moyasar — payment structure (not live yet)

## Memory Files

- ~/.openclaw/workspace/MEMORY-ECHO.md → management brain
- ~/.openclaw/workspace/MEMORY-ALPHA.md → Alpha + Fatoora Saver
- ~/.openclaw/workspace/MEMORY-OMEGA.md → market intelligence

## Token Balance Guidelines

MiniMax-M2.5 is cheap — use for orchestration and management
Claude Sonnet 4.6 — use for complex coding only, not for simple tasks
Gemini 2.5 Flash — free via Mousa's Gemini Pro plan, use generously for research
Kimi K2 via OpenRouter — use for marketing tasks, monitor spend

When context hits 70% → summarize and compress
When context hits 85% → clear session, reload from memory files
