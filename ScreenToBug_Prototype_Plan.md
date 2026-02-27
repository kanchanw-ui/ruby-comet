# Project: "Screen-to-Bug" Reporter (AI Prototype)

## 1. Concept Overview
An AI-powered diagnostic tool that converts screen recordings into structured bug reports (Steps to Reproduce, Actual Result, Severity) using visual analysis.

## 2. Core Constraints (Prototype)
- **Timeframe**: 4 Days
- **Developer**: 1
- **Video Limit**: Max 5 minutes per recording.
- **Scaling**: Not required (Single-user prototype).
- **Scope**: Visual-only analysis (Audio/Speech-to-Text excluded).

## 3. Technology Stack (Serverless)
| Layer | Technology |
| :--- | :--- |
| **Frontend/App** | **Next.js** (App Router) on **Vercel** |
| **Backend/Storage** | **Supabase** (Database + S3-compatible Storage) |
| **AI Intelligence** | **Gemini 2.5 Flash** (Native video reasoning) |
| **Capture Engine** | **MediaRecorder API** (Standard Web APIs) |

## 4. 4-Day Development Roadmap

### Day 1: Foundation (Capture & Storage)
*   **Recording**: Build a Next.js component using `navigator.mediaDevices.getDisplayMedia`.
*   **Limit**: Implement a 5-minute timer that auto-stops recording.
*   **Storage**: Direct upload of `.webm` chunks to **Supabase Storage**.

### Day 2: The AI Core (Visual Reasoning)
*   **AI Integration**: Create a Vercel Server Function to call the Gemini 2.5 Flash API.
*   **Prompts**: Optimize the prompt to extract:
    *   Sequence of UI interactions (clicks, inputs).
    *   Visual symptoms (error messages, crashes).
    *   Technical severity (Critical vs. Minor).

### Day 3: Workflow & Reporting
*   **Report Dashboard**: A UI to display the AI's markdown output.
*   **Edit State**: Allow users to manually correct or add details to the report.
*   **Persistence**: Save the finalized report to **Supabase PostgreSQL**.

### Day 4: Polish & Export
*   **UX/UI**: Premium Tailwind CSS styling with micro-animations.
*   **Export**: "Copy to Jira/GitHub" button (formats markdown for ticket systems).
*   **Handover**: Final end-to-end testing of the bug reporting flow.

## 5. Deployment Process
1. Initialize **Supabase** project for hosting data and videos.
2. Deploy **Next.js** to **Vercel** with `GOOGLE_GENERATIVE_AI_API_KEY` configured.
3. Access via the Vercel-generated URL.
