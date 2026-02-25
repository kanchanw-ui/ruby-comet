## Context

The "Screen-to-Bug" prototype successfully converts screen recordings into markdown bug reports. The current workflow relies on manual copy-pasting into issue trackers. This integration aims to provide a direct "Push to Jira" feature using the Jira Cloud REST API.

## Goals / Non-Goals

### Goals
- Securely store and use Jira Cloud credentials (API Token based).
- Map AI-generated bug report fields to Jira issue fields.
- Provide a responsive UI for configuration and issue creation.
- Support one-click creation with a direct link to the resulting Jira ticket.

### Non-Goals
- Supporting non-Cloud Jira instances (On-prem/Data Center).
- Bi-directional sync (status updates from Jira back to the app).
- Complex field mapping (custom logic for every Jira project).
- Attachment support (uploading the video to Jira) in the initial version.

## Architecture

### 1. Data Storage
- **Jira Config**: We will use a local storage approach or a simple `jira_config` table in Supabase. Since this is a single-user prototype, we can prioritize ease of configuration. For security, API tokens should never be logged or exposed in the frontend.
- **Issue Links**: Add a `jira_issue_key` column to the `bug_reports` table to track which reports have already been pushed.

### 2. API Implementation
- **Route**: `POST /api/jira/create-issue`
- **Authentication**: Basic Auth using `Email` and `API Token` as defined by Atlassian for Cloud.
- **Conversion**: The AI's markdown report will be mapped to the Jira `description`. Atlassian uses **Atlassian Document Format (ADF)** for descriptions. We will implement a lightweight markdown-to-ADF converter or use the simpler Jira API fields if allowed by the project's configuration.

### 3. Component Design
- `JiraConfigModal`: A Framer Motion powered modal for setting the Domain, Project Key, Email, and Token.
- `JiraPushButton`: A stateful button in the `reports/[id]` page that triggers the API call and handles the "View in Jira" link display.

## Decisions

### Decision 1: Authentication Method
**Decision**: Use Jira API Tokens.
- **Rationale**: OAuth 2.0 is more secure but requires significant setup for a prototype (apps, redirect URIs, tenant management). API Tokens are fast to generate and ideal for a developer-centric prototype.

### Decision 2: Description Formatting
**Decision**: Convert Markdown to ADF (Atlassian Document Format).
- **Rationale**: modern Jira Cloud projects require ADF for rich text formatting in the description field. We will use a basic mapping: 
  - Headers (#) → Headings
  - Lists (*) → bulletList
  - Bold (**) → strong marks

### Decision 3: Severity Mapping
**Decision**: Standardized lookup table.
- **Rationale**: 
  - Critical → Highest (Priority ID: 1)
  - Major → Medium (Priority ID: 3)
  - Minor → Lowest (Priority ID: 5)

## Risks / Trade-offs
- **ADF Complexity**: Atlassian's Document Format is complex. If a full conversion is too buggy, we will fall back to plain text description with the raw markdown.
- **Security**: Storing API tokens in the database requires encryption at rest. For this prototype, we will rely on Supabase's built-in security and warn the user.
