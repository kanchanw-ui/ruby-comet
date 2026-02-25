## 1. Project Setup

- [x] 1.1 Initialize Next.js App Router project and configure TypeScript, ESLint, and Tailwind CSS
- [x] 1.2 Set up Supabase project, create `recordings` and `bug_reports` tables, and configure storage bucket for recordings
- [x] 1.3 Configure environment variables in Vercel for Supabase and Gemini (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`)

## 2. Screen Recording Capture

- [x] 2.1 Implement `/record` page with UI controls to start and stop screen recording using `navigator.mediaDevices.getDisplayMedia`
- [x] 2.2 Integrate `MediaRecorder` to encode recordings as `.webm` and buffer data until recording stops
- [x] 2.3 Add five-minute recording timer that displays remaining time and automatically stops the recording at the limit
- [x] 2.4 Implement logic to manually stop recording and finalize the `.webm` blob
- [x] 2.5 Upload finalized recording to Supabase Storage and create or update a `recordings` row with metadata and status

## 3. AI Processing Pipeline (Gemini 1.5 Flash)

- [x] 3.1 Implement serverless API route (e.g., `POST /api/process-recording`) that accepts a `recordingId`
- [x] 3.2 Fetch the corresponding `.webm` from Supabase Storage on the server using Supabase SDK or signed URL
- [x] 3.3 Call Gemini 1.5 Flash with the video input and a structured prompt to extract steps, visual symptoms, and severity
- [x] 3.4 Map Gemini response into a markdown bug report structure and severity classification
- [x] 3.5 Create a `bug_reports` row linked to the `recordings` row with AI-generated `raw_markdown` and severity
- [x] 3.6 Update `recordings.status` as AI processing progresses (`pending_ai` → `ai_complete` → `report_finalized`)

## 4. Bug Report Dashboard & Editing

- [x] 4.1 Implement `/reports` page to list bug reports with title, severity, status, and created date
- [x] 4.2 Implement `/reports/[id]` detail page to display the full markdown bug report
- [x] 4.3 Add editable fields for title, severity, and report body (markdown text area or simple editor)
- [x] 4.4 Implement save behavior to persist edits back to the `bug_reports` table via server action or API route
- [x] 4.5 Display processing status indicators on dashboard entries (e.g., “Processing”, “Draft”, “Finalized”)

## 5. Export & UX Polish

- [x] 5.1 Implement “Copy to Jira/GitHub” button on the report detail view that composes export-ready markdown
- [x] 5.2 Use the Clipboard API to copy the export markdown and show success feedback to the user
- [x] 5.3 Apply Tailwind styling for layout, typography, and severity badges across `/record` and `/reports` pages
- [x] 5.4 Add micro-animations (hover states, subtle page transitions) to give the prototype a polished feel
- [ ] 5.5 Perform end-to-end manual testing from recording capture through AI processing, editing, and export

