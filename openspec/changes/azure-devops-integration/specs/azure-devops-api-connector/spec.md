## ADDED Requirements

### Requirement: Azure DevOps Configuration
The system must allow securely configuring and storing Azure DevOps connectivity details.

#### Scenario: User provides valid ADO credentials
- **WHEN** the user provides an Organization URL, Project Name, and Personal Access Token (PAT)
- **THEN** the system should validate the connection by attempting to list projects or verify the token
- **AND** save the credentials securely in the database

### Requirement: Work Item Creation (Bug)
The system must be able to create a new "Bug" work item in Azure DevOps from a bug report.

#### Scenario: Pushing a report to ADO
- **WHEN** the user clicks "Push to Azure DevOps"
- **THEN** the system should send a `POST` request to the ADO Work Items API (`/wit/workitems/$Bug`)
- **AND** use JSON Patch (`application/json-patch+json`) to set fields:
  - `System.Title`: The report title
  - `System.Description`: The report markdown (converted to HTML)
  - `Microsoft.VSTS.Common.Severity`: Mapped from report severity
- **AND** return the Work Item ID to the user

### Requirement: Severity Mapping
The system must translate the AI's severity levels to ADO's standard severity field values.

#### Scenario: Severity translation
- **WHEN** a report is "Critical"
- **THEN** it should map to "1 - Critical" in ADO
- **AND** "Major" to "2 - High"
- **AND** "Minor" to "4 - Low"
