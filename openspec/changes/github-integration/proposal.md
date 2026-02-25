## Why

Directly pushing bug reports to GitHub Issues streamlines the development workflow for teams using GitHub. Instead of copy-pasting markdown, users can create an issue with all the AI-generated details, severity, and context in one click.

## What Changes

- Add a "Push to GitHub" button to the report detail page.
- Implement a GitHub configuration modal for:
  - Repository Owner (e.g., `username` or `org`)
  - Repository Name (e.g., `my-repo`)
  - Personal Access Token (PAT)
- Create a backend API route `POST /api/github/create-issue`.
- Map report fields (Title, Markdown, Severity) to GitHub Issue fields (Title, Body, Labels).

## Capabilities

### New Capabilities
- `github-api-connector`: Handles communication with GitHub's REST API.
- `github-export-ui`: UI components for GitHub settings and export actions.

### Modified Capabilities
- `bug-report-export`: Add GitHub as a supported export destination.

## Impact

- **Frontend**: New `GitHubSettings.tsx` component and updates to the report sidebar.
- **Backend**: New API route and database table `github_config`.
- **Database**: Add `github_issue_number` to `bug_reports` to track synchronized issues.
