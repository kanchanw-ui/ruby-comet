## ADDED Requirements

### Requirement: Azure DevOps Integration Button
The bug report detail page must feature an action to push the report to Azure DevOps Boards.

#### Scenario: Button visibility
- **WHEN** the user is viewing a finalized bug report
- **THEN** an "Azure DevOps" button should be visible in the export actions area
- **AND** it should be disabled if ADO credentials are not configured

### Requirement: ADO Configuration Modal
Users must have a dedicated UI to manage their Azure DevOps connection.

#### Scenario: Configuration interface
- **WHEN** the user clicks "Azure DevOps Settings" or a corresponding icon
- **THEN** a glassmorphism modal should appear
- **AND** provide input fields for:
  - Organization URL (e.g. `https://dev.azure.com/your-org`)
  - Project Name
  - Personal Access Token (PAT)
- **AND** include a "Test Connection" button

### Requirement: Work Item Feedback
The UI must track which report has been pushed to ADO to prevent duplicates.

#### Scenario: Successful push
- **WHEN** the user pushes a report to ADO
- **THEN** on success, the button should display "✓ Pushed to ADO"
- **AND** show a link titled "View Work Item #[ID]" that opens the item in Azure DevOps
