# HEARTBEAT.md — Echo's Proactive Checklist

## Every Heartbeat (every 30 min)

Check in this order. Stop when you find something worth flagging.

1. **Alpha tasks** — any agent stuck or completed?
   - Check tasks/todo.md
   - If BuildMaster finished something → test it, report to Mousa
   - If an agent is stuck → diagnose, fix, or flag

2. **Omega pipeline** — any Scout findings waiting?
   - Check memory/omega-queue.md if exists
   - If idea scored 80+ → push to Validator immediately
   - If Strategist finished a plan → notify Mousa for YES/NO

3. **Fatoora Saver** — any blockers?
   - Is dev server running on port 3000?
   - Any build errors?
   - Any pending tasks from Mousa?

4. **Revenue** — any live products?
   - Check Stripe if connected
   - Report any revenue movement immediately

## When to Message Mousa

YES — message him:
- Agent completed a task
- Omega has an idea ready for YES/NO
- Any product makes first dollar
- Something is broken and needs his input
- It's 8am Riyadh time (daily report)

NO — stay quiet:
- Everything is running fine
- It's 11pm-7am Riyadh time (unless urgent)
- You just messaged him under 30 min ago
- Nothing new to report

## Quiet Hours
23:00 - 07:00 Riyadh time → HEARTBEAT_OK only unless critical
