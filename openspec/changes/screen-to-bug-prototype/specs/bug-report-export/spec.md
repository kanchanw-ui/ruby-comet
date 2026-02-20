## ADDED Requirements

### Requirement: Provide copy-ready export format
The system SHALL provide a copy-ready markdown representation of each finalized bug report suitable for pasting into Jira or GitHub issue forms.

#### Scenario: Export markdown generated
- **WHEN** the user views a finalized bug report
- **THEN** the system SHALL render an export-ready markdown string combining the report title, severity, steps to reproduce, actual result, and other key fields

### Requirement: Copy export content to clipboard
The system SHALL allow the user to copy the export-ready markdown to the system clipboard with a single action.

#### Scenario: Export copied successfully
- **WHEN** the user clicks the “Copy to Jira/GitHub” (or equivalent) control in the report detail view
- **THEN** the system SHALL copy the export-ready markdown to the clipboard and provide a success confirmation state

### Requirement: Preserve formatting for issue trackers
The system SHALL preserve headings, lists, and emphasis formatting in the exported markdown so that it remains readable in common issue trackers.

#### Scenario: Markdown renders correctly in external system
- **WHEN** the user pastes the exported markdown into a Jira or GitHub issue description field
- **THEN** the content SHALL render with structured sections (e.g., headings and bullet lists) that match the original report structure

