## Context

The goal is to build a single-user prototype that turns short screen recordings into structured bug reports using Gemini 1.5 Flash, within a four-day development window. The system should support screen capture in the browser, storage of recordings, AI processing of videos, and a simple workflow to review, edit, and export the resulting bug reports. The stack is constrained to Next.js (App Router) deployed on Vercel, Supabase for database and storage, and Gemini 1.5 Flash for video reasoning, with recordings limited to a maximum of five minutes and no audio analysis.

## Goals / Non-Goals

**Goals:**
- Provide a smooth browser-based flow to start and stop screen recordings and enforce a five-minute maximum duration.
- Persist recordings in Supabase Storage with enough metadata to later associate them with bug reports.
- Call Gemini 1.5 Flash with video input to extract structured bug-report fields: steps to reproduce, visual symptoms, and severity.
- Render an editable markdown bug report in a dashboard where the user can tweak details and save the final version to Supabase Postgres.
- Enable one-click copying of the finalized report into a format suitable for Jira or GitHub issues.
- Optimize for a single-user, non-scaled prototype that can be implemented by one developer in four days.

**Non-Goals:**
- Multi-tenant authentication, authorization, or role-based access control.
- Audio capture or speech-to-text based analysis.
- Advanced analytics, search, or collaboration features across many users or projects.
- Production-grade observability, rate limiting, or cost-optimization beyond basic guardrails.
- Full-featured Jira/GitHub integrations (we only provide copy-ready markdown, not API-based sync).

## Decisions

**Frontend framework and routing**
- Use Next.js App Router for the entire UI:
  - `/record`: screen capture page with recording controls.
  - `/reports`: dashboard listing existing bug reports.
  - `/reports/[id]`: detail view/editor for a single bug report.
- Rationale: App Router is first-class on Vercel and simplifies deployment and serverless route co-location.

**Screen capture implementation**
- Use `navigator.mediaDevices.getDisplayMedia` to capture the user’s screen and `MediaRecorder` to encode `.webm` chunks in the browser.
- Enforce the five-minute limit with a client-side timer that:
  - Shows remaining time to the user.
  - Automatically stops the `MediaStream` and `MediaRecorder` when the limit is reached.
- Rationale: Pure browser APIs avoid additional dependencies, and `.webm` is well-supported for streaming to storage and AI.

**Upload and storage strategy**
- After recording stops, upload the resulting `.webm` blob directly to Supabase Storage using signed upload URLs or client SDK with bucket-level rules configured for this prototype.
- Generate a `recordings` table row in Supabase Postgres containing:
  - `id` (UUID), `created_at`, `storage_path`, `status` (`pending_ai`, `ai_complete`, `report_finalized`).
  - Optional `title` or short description supplied by the user.
- Rationale: Separating binary storage (Supabase Storage) from metadata (Postgres) keeps queries fast and aligns with Supabase best practices.

**AI processing flow (Gemini 1.5 Flash)**
- Introduce a serverless route (e.g., `POST /api/process-recording`) that:
  - Accepts a `recordingId`.
  - Fetches the corresponding `.webm` from Supabase Storage (via server-side Supabase client or a signed URL).
  - Streams or uploads the video to the Gemini 1.5 Flash API using `GOOGLE_GENERATIVE_AI_API_KEY`.
  - Uses a strongly structured prompt that asks Gemini to return:
    - Ordered steps to reproduce.
    - Observed behavior and visual symptoms.
    - Error messages or dialogs (with on-screen text if visible).
    - A severity classification (e.g., Critical, Major, Minor) with a brief justification.
  - Writes an initial bug report row into a `bug_reports` table with:
    - `id`, `recording_id`, `raw_markdown`, `severity`, and timestamps.
- Rationale: Keeping Gemini calls server-side protects the API key and allows future retries or batching logic.

**Bug report data model**
- Define `bug_reports` table with fields:
  - `id` (UUID, primary key).
  - `recording_id` (FK to `recordings.id`).
  - `title` (editable).
  - `raw_markdown` (full AI-generated + user-edited content).
  - `severity` (enum or text).
  - `created_at`, `updated_at`.
- Rationale: Storing markdown keeps the prototype flexible while still allowing basic filtering on severity or created time.

**Dashboard and editing UX**
- Implement `/reports` as a list of bug reports with:
  - Title, severity badge, creation date, and a link to detail view.
- Implement `/reports/[id]` with:
  - A markdown editor (simple textarea or lightweight markdown editor component) bound to `raw_markdown`.
  - A severity selector and title input.
  - Save button that updates the corresponding `bug_reports` row via a server action or API route.
- Rationale: Minimal but sufficient for validating whether the AI output is useful and editable.

**Export behavior**
- In the report detail view, provide a “Copy to Jira/GitHub” button that:
  - Composes a markdown snippet using the current title, severity, and body.
  - Uses the Clipboard API to write text to the user’s clipboard.
- Rationale: Avoids complex third-party API integrations while still supporting the real workflow of pasting into an issue tracker.

**Styling and UX polish**
- Use Tailwind CSS for layout and styling, with a small set of motion primitives (e.g., hover transitions, subtle fades on page transitions, button presses).
- Keep the color palette simple but high-contrast for readability (e.g., neutral background, accent color for primary actions, severity badges).
- Rationale: Tailwind is fast to build with and works seamlessly in a Next.js/Vercel environment.

**Environment configuration**
- Store `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `GOOGLE_GENERATIVE_AI_API_KEY` as environment variables in Vercel.
- Use server-side Supabase clients and Gemini SDK/HTTP calls only in server contexts (API routes, server actions) to avoid leaking secrets.

## Risks / Trade-offs

- **AI output quality and determinism**
  - Risk: Gemini may sometimes miss subtle UI interactions or misclassify severity, reducing trust in the reports.
  - Trade-off: Acceptable for a prototype; mitigated by allowing full user editing and explicitly treating AI output as a draft.

- **Video upload and processing latency**
  - Risk: Uploading a five-minute `.webm` and running AI analysis could introduce noticeable delay before a report appears.
  - Trade-off: Prototype users can tolerate some latency; we can mitigate via clear loading states and limiting resolution/bitrate of recordings.

- **Client-side only enforcement of time limit**
  - Risk: Users could bypass the five-minute limit via dev tools or unsupported browsers.
  - Trade-off: Acceptable given the single-user, non-hostile context and prototype focus.

- **Supabase and Vercel dependency coupling**
  - Risk: The design is tightly coupled to Supabase Storage/Postgres and Vercel serverless; migrating later may require refactoring.
  - Trade-off: These services dramatically reduce setup time and operational overhead for this prototype.

- **Minimal security and auth**
  - Risk: Without full auth and authorization, the app is not safe for multi-user or production deployment.
  - Trade-off: Out of scope for this prototype; mitigate by keeping deployment URL unlisted and intended for internal use only.
