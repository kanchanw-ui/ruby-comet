## Why

The current process of turning screen recordings into actionable bug reports is manual, time-consuming, and often inconsistent. This change introduces an AI-powered prototype that automatically converts short screen recordings into structured bug reports so that a single developer can validate the concept quickly within a 4-day window.

## What Changes

- Introduce a single-user web application where a user can:
  - Start and stop a screen recording directly from the browser using standard web APIs.
  - Automatically limit recordings to a maximum duration of 5 minutes.
  - Upload captured recordings to persistent storage.
- Add an AI-powered processing pipeline that:
  - Sends stored screen recordings to Gemini 2.5 Flash for native video reasoning.
  - Extracts structured bug-report fields from the video (steps to reproduce, observed behavior, error visuals, severity).
- Provide a reporting experience that:
  - Displays the AI-generated bug report in a readable markdown format.
  - Allows users to edit and correct the generated content before saving.
  - Persists finalized reports in a database for later review.
- Deliver a polished prototype UX:
  - Tailwind-based layout and styling with lightweight micro-animations.
  - An export action to copy the report in a format suitable for Jira/GitHub tickets.

## Capabilities

### New Capabilities
- `screen-to-bug-reporting`: AI-powered conversion of short screen recordings into structured bug reports (steps, actual result, severity) using Gemini video reasoning.
- `screen-recording-capture`: Browser-based screen recording flow using `navigator.mediaDevices.getDisplayMedia` and `MediaRecorder`, with automatic 5-minute limit and upload to Supabase Storage.
- `bug-report-dashboard`: UI to browse and view AI-generated bug reports in markdown, with inline editing and save-to-database behavior.
- `bug-report-export`: One-click export of finalized bug reports into markdown formatted for Jira/GitHub issue creation.

### Modified Capabilities
- `<existing-name>`: <what requirement is changing>

## Impact

- Frontend:
  - New Next.js (App Router) pages and components for screen capture, recording controls, and the bug-report dashboard.
  - Integration of Tailwind CSS and simple animation primitives for a premium-feeling prototype UI.
- Backend / Infrastructure:
  - Supabase project required for Postgres database and S3-compatible object storage for `.webm` recordings.
  - New serverless API routes (e.g., Vercel functions) to:
    - Accept recording metadata and trigger AI processing.
    - Call the Gemini 2.5 Flash video API using `GOOGLE_GENERATIVE_AI_API_KEY`.
    - Persist finalized bug reports to Supabase Postgres.
- AI:
  - Prompt design tailored to extract steps to reproduce, visual symptoms, and severity from video-only input (no audio).
  - Guardrails around video length (max 5 minutes) to keep inference cost and latency predictable.
- Deployment / Operations:
  - Vercel deployment for the Next.js app with environment configuration for Gemini and Supabase credentials.
  - Single-user, non-scaled prototype assumptions (no multi-tenant auth, no heavy observability), appropriate for fast concept validation.
