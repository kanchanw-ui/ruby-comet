## ADDED Requirements

### Requirement: List generated bug reports
The system SHALL present a dashboard view listing all generated bug reports available to the user.

#### Scenario: Dashboard shows existing reports
- **WHEN** the user navigates to the bug report dashboard
- **THEN** the system SHALL display a list of bug reports including at least title, severity, and creation date for each report

### Requirement: View a single bug report
The system SHALL allow the user to open a detailed view for a selected bug report.

#### Scenario: Detailed report view opened
- **WHEN** the user selects a bug report from the dashboard list
- **THEN** the system SHALL navigate to a detail view showing the full report content

### Requirement: Edit AI-generated bug report content
The system SHALL allow the user to edit the AI-generated bug report content before finalizing it.

#### Scenario: Report content edited and saved
- **WHEN** the user modifies the report fields (e.g., title, steps, actual result, severity) and saves
- **THEN** the system SHALL persist the updated content to the database and reflect the changes on subsequent views

### Requirement: Indicate processing state of reports
The system SHALL indicate whether a report is awaiting AI processing, has an AI draft, or is finalized.

#### Scenario: Processing state displayed
- **WHEN** the dashboard loads
- **THEN** each report entry SHALL include a status indicator such as “Processing”, “Draft”, or “Finalized”

