## ADDED Requirements

### Requirement: GitHub Issue Creation

The system shall allow users to export a finalized bug report directly to a GitHub repository's issues list.

#### Scenario: Successful Export to GitHub
- **GIVEN** a finalized bug report exists
- **AND** GitHub is correctly configured with a PAT and repository
- **WHEN** the user clicks "Push to GitHub"
- **THEN** an issue is created in the specified GitHub repository
- **AND** the report shows a link to the new GitHub issue
- **AND** the issue body contains the full markdown of the report

### Requirement: GitHub Configuration

Users must be able to securely configure their GitHub settings within the application.

#### Scenario: Saving Configuration
- **WHEN** the user enters their Owner, Repo, and PAT in the GitHub settings modal
- **THEN** the configuration is saved to the database
- **AND** the user can test the connection to verify the repository exists
