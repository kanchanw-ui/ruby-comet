## ADDED Requirements

### Requirement: Start screen recording from the web app
The system SHALL allow the user to initiate a screen recording session from within the web application using standard browser APIs.

#### Scenario: Recording started
- **WHEN** the user clicks the “Start Recording” control and grants screen-share permission
- **THEN** the system SHALL begin capturing the selected screen or window stream

### Requirement: Enforce maximum recording duration
The system SHALL enforce a maximum recording duration of five minutes per session.

#### Scenario: Recording auto-stops at time limit
- **WHEN** an active recording reaches five minutes of elapsed time
- **THEN** the system SHALL automatically stop the recording and release the captured media stream

### Requirement: Allow manual stop of recording
The system SHALL allow the user to stop recording manually before the time limit is reached.

#### Scenario: User stops recording early
- **WHEN** the user clicks the “Stop Recording” control during an active recording
- **THEN** the system SHALL stop capturing immediately and finalize the recording

### Requirement: Upload finalized recording to storage
The system SHALL upload each finalized recording to persistent object storage with an associated metadata record.

#### Scenario: Recording uploaded successfully
- **WHEN** a recording is finalized (auto-stop or manual stop)
- **THEN** the system SHALL upload the recording to Supabase Storage and create or update a metadata record linking the recording to its storage path

