## ADDED Requirements

### Requirement: Generate structured bug report from recording
The system SHALL generate a structured bug report from an uploaded screen recording that captures a single user session (up to five minutes in length).

#### Scenario: Successful bug report generation
- **WHEN** a valid recording (<= 5 minutes, supported format) is processed by the AI pipeline
- **THEN** the system SHALL create a bug report record associated with that recording

### Requirement: Extract steps to reproduce from visual interactions
The system SHALL infer and list the key steps to reproduce the observed issue based solely on visual cues in the screen recording.

#### Scenario: Steps to reproduce extracted
- **WHEN** the recording shows a sequence of user interactions leading to an issue
- **THEN** the generated bug report SHALL include an ordered list of steps to reproduce those interactions

### Requirement: Describe visual symptoms and error states
The system SHALL describe visible error messages, UI glitches, and crash states observed in the recording.

#### Scenario: Visual error message captured
- **WHEN** an error dialog or on-screen error message appears in the recording
- **THEN** the generated bug report SHALL include the error description and any readable error text in the visual symptoms section

### Requirement: Assign severity to the issue
The system SHALL assign a severity label (e.g., Critical, Major, Minor) to each generated bug report, with a brief justification.

#### Scenario: Severity assigned
- **WHEN** the AI pipeline completes processing a recording
- **THEN** the resulting bug report SHALL include a severity field and a one- to two-sentence justification for that severity

