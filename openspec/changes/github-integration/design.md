## Context

The app currently supports Jira and Azure DevOps. Adding GitHub Issues covers the three most common platforms for developer bug tracking.

## Goals / Non-Goals

### Goals
- Support GitHub Cloud (github.com).
- Use Personal Access Tokens (PAT) for simple authentication.
- Preserve markdown formatting (GitHub native).
- Track issue numbers for cross-linking.

### Non-Goals
- GitHub Enterprise Server (on-prem) support in V1.
- Bi-directional sync.
- Managing GitHub labels (other than basic severity mappings).

## Architecture

### 1. Data Storage
- **Table**: `github_config` (id, owner, repo, pat, created_at, updated_at).
- **Report tracking**: Add `github_issue_number` and `github_repo_full_name` to `bug_reports`.

### 2. API Implementation
- **Route**: `POST /api/github/create-issue`
- **Authentication**: Bearer token (PAT).
- **Payload**:
  ```json
  {
    "title": "Bug Report Title",
    "body": "Markdown Body...",
    "labels": ["bug", "severity-high"]
  }
  ```

### 3. Decisions

#### Decision 1: Label Mapping
**Decision**: Map severity to GitHub labels.
- **Rationale**: GitHub doesn't have a native "Severity" field like Jira. Labels are the standard way to categorize issues. We will create/use labels like `severity:high`, `severity:medium`.

#### Decision 2: Markdown Handling
**Decision**: Send raw markdown.
- **Rationale**: GitHub body field supports GFM (GitHub Flavored Markdown) natively, so no conversion is needed unlike Jira's ADF.
