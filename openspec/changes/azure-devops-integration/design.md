## Context

The Screen-to-Bug prototype currently supports Jira integration. This design extends the platform to support Azure DevOps (ADO) Boards, allowing users to create "Bug" work items directly from AI-generated reports.

## Goals / Non-Goals

### Goals
- Securely store ADO PATs and project details.
- Convert Markdown reports to HTML (required by the ADO Work Items API).
- Support standard ADO "Bug" work item fields.
- Provide a responsive UI for multi-platform export.

### Non-Goals
- Supporting Azure DevOps Server (On-prem).
- Syncing comments or status from ADO back to the app.
- Uploading video attachments to ADO in this version.

## Architecture

### 1. Data Storage
- **ADO Config**: Add an `ado_config` table to Supabase storing `org_url`, `project`, and `pat`.
- **Work Item Tracking**: Add an `ado_work_item_id` column to the `bug_reports` table.

### 2. API Integration
- **Endpoint**: `POST /api/ado/create-work-item`
- **Auth**: Basic authentication using an empty username and the PAT as the password: `base64(":PAT")`.
- **Payload**: ADO uses **JSON Patch** (RFC 6902). The request body must be an array of operations:
  ```json
  [
    { "op": "add", "path": "/fields/System.Title", "value": "Bug Title" },
    { "op": "add", "path": "/fields/System.Description", "value": "HTML Content" }
  ]
  ```

### 3. Component Design
- `AzureDevOpsSettings`: A modal component similar to `JiraSettings`.
- `AzureDevOpsPushButton`: Integrated into the `ReportDetailPage` sidebar.

## Decisions

### Decision 1: HTML Conversion
**Decision**: Use a basic Markdown-to-HTML converter.
- **Rationale**: ADO's `System.Description` field expects HTML. We will use a simple mapping of common elements (headers, lists, bold) to standard HTML tags.

### Decision 2: Authentication
**Decision**: Personal Access Tokens (PAT).
- **Rationale**: PATs are the most straightforward way for developers to authenticate with their own instance in a prototype scenario.

## Risks / Trade-offs
- **PAT Scopes**: Users must ensure their PAT has "Work Items: Read & Write" scopes. We should document this in the UI.
- **ADO Versioning**: The API version `7.0` will be used for stability.
