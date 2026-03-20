# SŪQAI Homepage Deployment Mismatch Investigation

**Date:** 2026-03-13
**Investigator:** Claude (AI agent)
**Scope:** Why does the live production homepage still show old behavior despite source-code fixes?

---

## Section 1: Production Mismatch Summary

The user reports that the live production site at `suqaist.vercel.app` still shows old homepage behavior — specifically, the pre-Quality-Sprint UI that lacks pillar bars, `/100` indicators, dynamic verdicts, freshness dates, and proper ticker chip formatting. Two commits have been pushed to `main`:

- `09ee1f1` — "Quality Sprint" (303 insertions) — ALL major UI additions
- `7724244` — "fix: Number() cast + displayName" — two targeted bug fixes

Both commits are confirmed pushed to `origin/main`. The source code is verified correct. Yet the live site reportedly does not reflect these changes.

**I cannot independently confirm the live site's state.** All outbound HTTP requests from this VM are blocked (egress firewall). I have not seen the live homepage. Every statement I make about "what production shows" is based on your report, not my own observation.

---

## Section 2: Claimed Fix vs. Live Reality

| # | Issue | Claimed Fix (Source) | What You See Live | Source Verified? | Live Verified? |
|---|-------|---------------------|-------------------|-----------------|----------------|
| Q1 | "Fair Value" label instead of "Latest Price" | `featured.latest_price` key at line 301 of `page.tsx` | Still shows "Fair Value" | YES — line 301 confirmed | **NO — cannot reach site** |
| Q2 | No `/100` after SŪQAI Score | `/100` suffix at lines 461-466 | Not showing | YES — lines 461-466 confirmed | **NO** |
| Q3 | Missing pillar mini-bars (V/G/M/H/D) | Pillar bars at lines 484-508 | Not showing | YES — lines 484-508 confirmed | **NO** |
| Q4 | "stc" lowercase instead of "STC" | `displayName()` + `UPPERCASE_WORDS` set | Still lowercase | YES — display-names.ts confirmed | **NO** |
| Q5 | Ticker chips bunched together | `gap-2` class at line 358 | Still bunched | YES — line 358 confirmed | **NO** |
| Q6 | Extreme dividend yields (e.g., 1517%) | `Number()` cast at line 116 | Still extreme | YES — line 116 confirmed | **NO** |

**Key observation:** ALL SIX issues show the same pattern — source code is correct, but none appear to be live. This rules out individual code bugs and points to a systemic deployment failure. If even ONE fix were live, we'd see a mix of fixed/unfixed items.

---

## Section 3: Root-Cause Investigation

### Cause A: Vercel never received the push
**Status: RULED OUT**

Git remote is `github.com/mmaashi/mmaashi.github.io.git`. Push succeeded — terminal output confirmed `09ee1f1..7724244 main -> main`. Local and remote HEAD match.

### Cause B: Vercel is not connected to this repository
**Status: POSSIBLE — HIGHEST PRIORITY TO INVESTIGATE**

This is the most likely root cause. The repo is named `mmaashi.github.io` — the exact naming convention GitHub Pages uses to auto-deploy. Vercel connects to specific GitHub repos, but:

- We have no way to verify from this VM that Vercel is watching `mmaashi/mmaashi.github.io`
- Vercel may be connected to a DIFFERENT repo, or a fork
- Vercel may be connected to a different BRANCH (not `main`)
- The Vercel project may have been disconnected at some point

**Evidence needed:** Log into Vercel dashboard → Settings → Git → verify the connected repository and branch.

### Cause C: Vercel build failed silently
**Status: POSSIBLE**

Even with `ignoreBuildErrors: true` (which only skips TypeScript errors), the build could fail for other reasons:

- Runtime import errors
- Missing environment variables (Supabase keys)
- Node.js version incompatibility
- Memory/timeout during build

Vercel does NOT auto-notify on build failures unless email notifications are configured. A failed build means the previous successful deployment remains live.

**Evidence needed:** Vercel dashboard → Deployments tab → check if `7724244` and `09ee1f1` have "Ready" or "Error" status.

### Cause D: GitHub Pages is serving the site instead of Vercel
**Status: POSSIBLE**

The repo name `mmaashi.github.io` automatically enables GitHub Pages on push. If the DNS/domain `suqaist.vercel.app` is correctly pointed to Vercel, this shouldn't matter. But if there's ANY DNS confusion, or if the user is visiting a GitHub Pages URL instead, they'd see a completely different (likely broken) output.

The `docs/` directory contains only markdown documentation files (not a static site export), so GitHub Pages wouldn't serve a functioning site from `docs/`. But GitHub Pages could be serving from the `main` branch root, showing a raw file listing or a 404.

**Evidence needed:** Visit `mmaashi.github.io` directly — does it show anything? Is it different from `suqaist.vercel.app`?

### Cause E: Browser/CDN caching
**Status: POSSIBLE BUT UNLIKELY AS SOLE CAUSE**

Next.js SSR pages (which this homepage is — it's an `async` server component with Supabase fetches) are not normally cached by Vercel's CDN unless explicitly configured. `vercel.json` has no caching headers. However:

- The user's browser may have a stale service worker
- Vercel's edge may cache for short periods
- `Cache-Control` headers from Next.js defaults could cause brief caching

This is unlikely to persist across page refreshes, incognito mode, or multiple hours.

**Evidence needed:** Open the site in incognito mode. Check `View Source` in browser. Check response headers for `Cache-Control` and `x-vercel-cache`.

### Cause F: Environment variables missing on Vercel
**Status: POSSIBLE**

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set in Vercel's project settings, the build might succeed but the runtime would fail to fetch data, potentially causing the page to render differently or fall back to an error state.

**Evidence needed:** Vercel dashboard → Settings → Environment Variables → verify Supabase keys exist.

### Cause G: Competing deployment (e.g., old `out/` or `.next/` checked into git)
**Status: RULED OUT**

There is no `out/` directory, no `.next/` directory in git, and `next.config.ts` does not have `output: 'export'`. The build command in `vercel.json` is `npm run build` which runs `next build` (standard SSR build).

---

## Section 4: File-Path Verification

| File | Path Verified | Exists on Disk | In Git? | Contains Expected Code? |
|------|--------------|----------------|---------|------------------------|
| Homepage | `src/app/[locale]/page.tsx` | YES | YES (HEAD) | YES — all 6 fixes present |
| i18n translations | `src/lib/i18n.ts` | YES | YES | YES — `featured.latest_price`, chip keys |
| Display names | `src/lib/display-names.ts` | YES | YES | YES — `UPPERCASE_WORDS` with "STC" |
| Score calculation | `src/lib/scores.ts` | YES | YES | YES — always returns non-null pillars |
| Middleware | `src/middleware.ts` | YES | YES | YES — no interference with `/en` routes |
| Vercel config | `vercel.json` | YES | YES | YES — standard build config, no caching |
| Next config | `next.config.ts` | YES | YES | YES — `ignoreBuildErrors: true`, redirects only |

There are NO competing route files. No `src/app/page.tsx` (without locale). No `src/pages/` directory. The `[locale]/page.tsx` is the only possible homepage route.

---

## Section 5: Deployment Truth Assessment

| Question | Answer | Confidence |
|----------|--------|------------|
| Is the source code for all 6 fixes present in `src/app/[locale]/page.tsx`? | **YES** | HIGH — verified by reading the file |
| Is the latest commit pushed to GitHub? | **YES** | HIGH — push output confirmed, local = remote |
| Is Vercel connected to `mmaashi/mmaashi.github.io` on the `main` branch? | **UNKNOWN** | ZERO — cannot access Vercel dashboard |
| Did Vercel build succeed for commit `7724244`? | **UNKNOWN** | ZERO — cannot access Vercel dashboard |
| Did Vercel build succeed for commit `09ee1f1`? | **UNKNOWN** | ZERO — cannot access Vercel dashboard |
| Is `suqaist.vercel.app` serving from this Vercel project? | **UNKNOWN** | ZERO — cannot reach the URL |
| Are Supabase environment variables set on Vercel? | **UNKNOWN** | ZERO — cannot access Vercel dashboard |
| Is browser caching the culprit? | **UNKNOWN** | ZERO — cannot test from here |
| Does `mmaashi.github.io` serve a competing site? | **UNKNOWN** | ZERO — cannot reach the URL |

**Summary: 2 confirmed YES, 7 UNKNOWN.** The investigation cannot be completed from this VM.

---

## Section 6: Required Evidence (User Must Gather)

These steps must be performed by you (Mousa) from your browser. I cannot do any of them from this VM.

### 6.1 — Vercel Dashboard (MOST CRITICAL)
1. Go to **vercel.com/dashboard**
2. Find the project that serves `suqaist.vercel.app`
3. Click **Deployments** tab:
   - Does the latest deployment show commit `7724244`?
   - Is its status "Ready" (green) or "Error" (red)?
   - When was the last successful deployment?
4. Click **Settings → Git**:
   - What repo is connected? Is it `mmaashi/mmaashi.github.io`?
   - What branch is it watching? Is it `main`?
5. Click **Settings → Environment Variables**:
   - Are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` present?

### 6.2 — Browser Evidence
1. Open `suqaist.vercel.app` in **Chrome Incognito** (Cmd+Shift+N)
2. Right-click → **View Page Source**
3. Search for `latest_price` or `/100` in the HTML source
4. Open DevTools → Network tab → refresh → click on the main document → check **Response Headers**:
   - What is `x-vercel-cache`? (HIT = cached, MISS = fresh)
   - What is `x-vercel-id`?

### 6.3 — GitHub Pages Check
1. Visit `https://mmaashi.github.io` in a browser
2. Does it load anything? Is it the same site as `suqaist.vercel.app`?
3. In your GitHub repo settings (`github.com/mmaashi/mmaashi.github.io/settings/pages`):
   - Is GitHub Pages enabled? If so, what's the source?

---

## Section 7: Immediate Next Actions

**Priority order — do these in sequence:**

1. **CHECK VERCEL DEPLOYMENTS** (2 minutes)
   - If the latest deployment shows "Error" → we found the problem. Check build logs for the error.
   - If the latest deployment shows "Ready" but with an OLD commit → Vercel isn't detecting pushes. Reconnect the repo.
   - If no deployments exist for this repo → Vercel isn't connected. Set it up.

2. **IF VERCEL BUILD FAILED** → Read the build log. Common causes:
   - Missing env vars → Add them in Settings → Environment Variables
   - Module errors → May need to clear cache: Settings → General → "Clear Build Cache & Redeploy"

3. **IF VERCEL LOOKS FINE** → Test browser caching:
   - Incognito mode
   - Hard refresh (Cmd+Shift+R)
   - Try from a different device or network

4. **IF GITHUB PAGES IS ALSO SERVING** → Disable it:
   - Repo Settings → Pages → Source → "None"

5. **MANUAL REDEPLOY** (if nothing else works):
   - Vercel dashboard → latest deployment → three-dot menu → "Redeploy"
   - OR: push an empty commit: `git commit --allow-empty -m "trigger redeploy" && git push`

---

## Section 8: Accountability Statement

I acknowledge the following failures in my prior work:

1. **I claimed fixes were "complete" and "deployed" based solely on source-code analysis.** I never verified the live production site. Every "fix complete" statement was a claim about what the code SHOULD do, not what it DOES do in production.

2. **I cannot access the live site from this environment.** All outbound HTTP requests are blocked by the VM's egress firewall. I should have disclosed this limitation immediately rather than implying deployment was verified.

3. **I did not investigate the deployment pipeline.** I focused entirely on code correctness and never asked: "Is Vercel actually building and deploying this repo?" The `mmaashi.github.io` repo naming convention was a red flag I should have surfaced earlier.

4. **The gap between "code is correct" and "production works" is the entire job.** Writing correct code that never reaches production is zero value delivered. I should have made production verification a mandatory step before any completion claim.

**What I can confirm with certainty:**
- The source code for all 6 fixes exists in the repo at HEAD (`7724244`)
- The code is pushed to GitHub
- The code logic is correct (verified by reading every relevant file)

**What I cannot confirm:**
- Whether Vercel received the code
- Whether Vercel built it successfully
- Whether the live URL serves output from this Vercel project
- Whether the user's browser is showing a fresh page

**The resolution requires you (Mousa) to perform Section 6 — specifically checking the Vercel dashboard.** Once you share those findings, I can diagnose the exact failure point and provide a targeted fix.

---

*End of report.*
