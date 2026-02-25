## Why

Currently, users can only copy bug reports to their clipboard and manually paste them into Jira. This is a friction point. Direct integration will allow one-click bug creation in Jira, making the "Screen-to-Bug" workflow truly seamless and enterprise-ready.

## What Changes

- Add a "Push to Jira" button on the bug report detail page.
- Implement a configuration section (or modal) to securely store Jira credentials:
  - Jira Domain (e.g., `company.atlassian.net`)
  - Project Key (e.g., `PROJ`)
  - Email & API Token
- Create a server-side route to call the Jira Cloud REST API.
- Map AI-generated bug report fields (Title, Markdown Body, Severity) to Jira issue fields.

## Capabilities

### New Capabilities
- `jira-api-connector`: Core logic to authenticate and communicate with the Jira Cloud REST API for issue creation.
- `jira-export-ui`: UI updates to the report detail page and a new settings view for Jira configuration.

### Modified Capabilities
- `bug-report-export`: Extend the existing export capability to include direct Jira push alongside the "Copy to Clipboard" feature.

## Impact

- **Frontend**: 
  - New configuration modal or page for Jira settings.
  - Updated "Export" section in the report detail view.
- **Backend**:
  - New API route `POST /api/jira/create-issue`.
  - Database updates to store (optionally) or handle Jira configuration.
- **AI**:
  - No changes needed to the core AI processing, though prompts could be tweaked later to specifically tag reports for Jira.
- **Operations**:
  - New environment variables or database fields for Jira authentication.
