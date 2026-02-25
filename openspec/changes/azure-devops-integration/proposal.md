## Why

After successfully implementing Jira integration, the next logical step for enterprise adoption is **Azure DevOps (ADO)**. Many teams rely on ADO Boards for tracking work items, bugs, and tasks. Providing a native integration will allow users to push AI-detected bugs directly into their ADO backlog.

## What Changes

- Add an "ADO Settings" section/modal to configure:
  - Azure DevOps Organization URL (e.g., `https://dev.azure.com/org`)
  - Project Name
  - Personal Access Token (PAT)
- Create a new API route `POST /api/ado/create-work-item`.
- Implement a "Push to Azure DevOps" button on the bug report detail page.
- Map bug report fields to ADO Work Item fields (Bug type).

## Capabilities

### New Capabilities
- `azure-devops-api-connector`: Logic for authenticating and communicating with the Azure DevOps Services REST API.
- `azure-devops-export-ui`: UI updates for ADO settings and export actions.

### Modified Capabilities
- `bug-report-export`: Extend to include Azure DevOps as a destination.

## Impact

- **Frontend**: 
  - New configuration modal for ADO.
  - New export action on the report detail page.
- **Backend**: 
  - New API route.
  - Database schema update to store ADO configuration.
- **Security**: 
  - Storage and handling of Personal Access Tokens (PATs).
