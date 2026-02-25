## 1. Foundation & Configuration

- [x] 1.1 Update `supabase/schema.sql` to include an `ado_config` table and add `ado_work_item_id` to the `bug_reports` table.
- [x] 1.2 Build the `AzureDevOpsSettings` component (modal) for credential entry and testing.
- [x] 1.3 Implement a test connection route `POST /api/ado/test-connection` to verify PAT and Project connectivity.

## 2. ADO API Connector (Backend)

- [x] 2.1 Implement server-side route `POST /api/ado/create-work-item` using JSON Patch format.
- [x] 2.2 Create a utility function `markdownToHTML` in `lib/adoUtils.ts` to format bug reports for Azure DevOps.
- [x] 2.3 Implement severity-to-priority mapping (ADO format).
- [x] 2.4 Add error handling for common ADO API failures (auth, project not found, invalid fields).

## 3. UI Integration

- [x] 3.1 Add the "Push to Azure DevOps" button to the report detail page.
- [x] 3.2 Implement state management for the ADO push action (loading, success, error).
- [x] 3.3 Link the "View Work Item" UI to the actual ADO work item URL.
- [x] 3.4 Add ADO Settings access to the application header.

## 4. Verification

- [x] 4.1 Test the end-to-end flow: config -> capture -> push -> verify in ADO Board.
- [x] 4.2 Polish the UI feedback (toasts and animations).
