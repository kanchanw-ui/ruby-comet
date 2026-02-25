## ADDED Requirements

### Requirement: Jira Integration Button
The bug report detail page must feature a prominent action to push the report to Jira.

#### Scenario: Button visibility and state
- **WHEN** the user is viewing a finalized bug report
- **THEN** a "Push to Jira" button should be visible in the export actions area
- **AND** the button should be disabled if Jira credentials are not yet configured

### Requirement: Jira Configuration Modal
Users must have a clear UI to enter and save their Jira credentials.

#### Scenario: Accessing Jira settings
- **WHEN** the user clicks a "Configure Jira" button or a settings icon
- **THEN** a glassmorphism modal should appear
- **AND** provide input fields for Jira Domain, Project Key, Email, and API Token
- **AND** include a "Test Connection" button that provides immediate visual feedback

#### Scenario: Saving credentials
- **WHEN** the user clicks "Save Configuration" in the modal
- **THEN** the modal should show a loading state
- **AND** close on success with a "Configuration Saved" toast notification

### Requirement: Issue Creation Feedback
The UI must provide clear feedback during and after the Jira push process.

#### Scenario: Successful push
- **WHEN** the user clicks "Push to Jira"
- **THEN** the button should show a "Pushing..." loading state
- **AND** on success, display a "View in Jira" link with the issue key
- **AND** show a success animation (e.g., checkmark)

#### Scenario: Error handling
- **WHEN** the Jira API returns an error
- **THEN** the UI should display a descriptive error message (e.g., "Invalid API Token")
- **AND** allow the user to retry or update their settings
