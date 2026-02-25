## 1. Database & Prep

- [x] 1.1 Create `github_config` table in Supabase.
- [x] 1.2 Add `github_issue_number` and `github_repo_full_name` columns to `bug_reports` table.
- [x] 1.3 Add public access policies for the new table.

## 2. API Routes

- [x] 2.1 Create `POST /api/github/test-connection` to verify PAT and repo access.
- [x] 2.2 Create `POST /api/github/create-issue` to handle the actual export logic.

## 3. UI Integration

- [x] 3.1 Build `GitHubSettings.tsx` modal component.
- [x] 3.2 Add "GitHub Settings" access to the application header.
- [x] 3.3 Add "Push to GitHub" button and link handling to the report detail page.

## 4. Verification

- [x] 4.1 Verify connection testing works with a valid PAT.
- [x] 4.2 Verify issue creation results in a clickable link to GitHub.
