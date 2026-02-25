## ADDED Requirements

### Requirement: Jira Project Configuration
The system must allow securely configuring and storing Jira connectivity details.

#### Scenario: User provides valid Jira credentials
- **WHEN** the user provides a Jira Domain, Project Key, Email, and API Token
- **THEN** the system should validate the connection using a simple API call (e.g., fetch project metadata)
- **AND** save the credentials securely if the validation succeeds

### Requirement: Jira Issue Creation
The system must be able to create a new Jira issue from an AI-generated bug report.

#### Scenario: Pushing a report to Jira
- **WHEN** the user clicks "Push to Jira" on a finalized bug report
- **THEN** the system should send a `POST` request to the Jira `issue` endpoint
- **AND** map the report's `title` to `summary`
- **AND** map the report's `raw_markdown` to the `description` (converted to Atlassian Document Format if necessary)
- **AND** map the report's `severity` to the nearest Jira `priority` or a custom field
- **AND** return the Jira issue key (e.g., `BUG-123`) to the user as success feedback

### Requirement: Severity Mapping
The system must translate the AI's severity classifications to Jira's priority levels.

#### Scenario: Mapping severity to priority
- **WHEN** a report is classified as "Critical"
- **THEN** the Jira issue priority should be set to "Highest" or "P0" (configurable)
- **AND** "Minor" should map to "Lowest" or "P3"
