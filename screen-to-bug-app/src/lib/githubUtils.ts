export function mapSeverityToGitHubLabels(severity: string | null): string[] {
    const labels = ["bug"];
    if (!severity) return labels;

    const s = severity.toLowerCase();
    if (s.includes("critical") || s.includes("highest")) {
        labels.push("severity:critical");
    } else if (s.includes("major") || s.includes("high")) {
        labels.push("severity:high");
    } else if (s.includes("minor") || s.includes("low")) {
        labels.push("severity:low");
    } else {
        labels.push("severity:medium");
    }

    return labels;
}
