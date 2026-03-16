# Screen-to-Bug — Demo Brief

**Deployed on:** Vercel  
**One-liner:** Turn screen recordings into structured bug reports using AI.

---

## Problem statement

- **Manual bug reports are slow and inconsistent** — Developers and QA spend time writing steps, copying screenshots, and formatting for Jira/GitHub.
- **Reproducing bugs is tedious** — Long written steps get outdated; video captures the real flow but isn’t machine-readable.

---

## Why this solution

- **Record once** — Capture the bug in a short screen recording (up to 5 min) in the browser; no extra tools.
- **AI does the writing** — Gemini analyzes the video and outputs: Steps to Reproduce, Actual/Expected Result, Visual Symptoms, Severity.
- **Structured from day one** — Reports are markdown; editable; exportable to GitHub (and Jira/ADO via settings).

---

## Tech stack (brief)

| Layer        | Technology |
|-------------|------------|
| **Frontend** | Next.js (App Router), React, Tailwind CSS |
| **Hosting**  | Vercel (serverless) |
| **Database & storage** | Supabase (PostgreSQL + Storage for recordings) |
| **AI**       | Google Gemini 2.5 Flash (video + text) |
| **Capture**  | Browser MediaRecorder API (no install) |

---

## Cost (typical demo / low usage)

| Service   | Tier / usage              | Cost (approx) |
|-----------|---------------------------|----------------|
| **Vercel** | Hobby / free tier         | $0 (within limits) |
| **Supabase** | Free tier (DB + storage) | $0 (within limits) |
| **Gemini API** | Free tier (rate limits)   | $0 for light use; pay-as-you-go if over quota |
| **Total**  | Demo / prototype           | **$0** for modest use; scale with usage |

**When is cost zero?** For about **5–10 active users** (or ~50–100 report generations per month), staying within each service’s free tier, the app can run at **$0**. The usual limit is the Gemini API free quota (requests per day); Vercel and Supabase free tiers are typically enough for a small team or demo.

*For production or heavy use: Vercel Pro, Supabase Pro, and Gemini pay-per-use; costs scale with traffic and API calls.*

---

## Demo flow (1 min)

1. Open app → **Record a Bug** → share screen, reproduce bug, stop (or run up to 5 min).
2. Recording uploads; AI generates the report (Steps, Actual/Expected, Severity).
3. **Review Reports** → open report → edit if needed → **Preview** (readable) or **Markdown** (raw).
4. **Push to Github** (if configured) to create an issue, or copy the report for Jira/ADO.

---

*Screen-to-Bug — Record. Review. Report.*
