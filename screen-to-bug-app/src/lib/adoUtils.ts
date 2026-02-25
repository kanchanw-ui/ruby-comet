export function markdownToHTML(markdown: string): string {
    // Simple markdown to HTML conversion for ADO
    let html = markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/\n\n/gim, '<br/><br/>')
        .replace(/\n/gim, '<br/>');

    // Wrap list items in <ul>
    if (html.includes('<li>')) {
        // This is a naive wrap, but sufficient for simple bug reports
        html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    }

    return html;
}

export function mapSeverityToADOSeverity(severity?: string): string {
    const s = severity?.toLowerCase() || "";
    if (s.includes("critical")) return "1 - Critical";
    if (s.includes("major")) return "2 - High";
    if (s.includes("medium")) return "3 - Medium";
    return "4 - Low";
}
