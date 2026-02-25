## 1. Foundation & Configuration

- [x] 1.1 Update `supabase/schema.sql` to include a `jira_config` table (or secure metadata storage) and a `jira_issue_key` column in `bug_reports`.
- [x] 1.2 Implement a "Settings" modal or section to securely input and test Jira credentials (Domain, Email, API Token, Project Key).
- [x] 1.3 Create a server action or API route to save and retrieve Jira configuration securely.

## 2. Jira API Connector (Backend)

- [x] 2.1 Implement server-side route `POST /api/jira/create-issue` that handles authentication using Jira API Tokens.
- [x] 2.2 Create a utility function to convert Markdown bug reports into Atlassian Document Format (ADF) for Jira consumption.
- [x] 2.3 Implement severity-to-priority mapping logic (e.g., Critical -> Highest).
- [x] 2.4 Add error handling for common Jira API failures (auth errors, invalid project keys, rate limits).

## 3. User Interface Integration

- [x] 3.1 add the "Push to Jira" button to the bug report detail page (`/reports/[id]`).
- [x] 3.2 Implement loading and success states for the push action (e.g., "Pushing...", "Sent to Jira").
- [x] 3.3 Add a "View in Jira" link that appears once the issue key is successfully returned from the API.
- [x] 3.4 Integrate the Jira configuration modal into the main dashboard or report detail view.

## 4. Polishing & Verification

- [x] 4.1 Update UI styling to match the premium glassmorphism theme (Framer Motion animations for the modal and button feedback).
- [x] 4.2 Perform end-to-end testing: configure Jira, record a bug, generate report, and push to a real Jira project.
- [x] 4.3 Add success toast notifications and refined error messages.
