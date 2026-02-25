export function markdownToADF(markdown: string) {
    // Very basic markdown to Atlassian Document Format (ADF) converter
    // ADF is complex, so we'll start with a safe subset

    const blocks = markdown.split('\n\n').map(block => {
        if (block.startsWith('# ')) {
            return {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: block.replace('# ', '') }]
            };
        }
        if (block.startsWith('## ')) {
            return {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: block.replace('## ', '') }]
            };
        }
        if (block.startsWith('- ') || block.startsWith('* ')) {
            const items = block.split('\n').map(item => ({
                type: 'listItem',
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: item.replace(/^[-*] /, '') }]
                }]
            }));
            return {
                type: 'bulletList',
                content: items
            };
        }
        return {
            type: 'paragraph',
            content: [{ type: 'text', text: block }]
        };
    });

    return {
        version: 1,
        type: 'doc',
        content: blocks
    };
}

export function mapSeverityToPriority(severity?: string) {
    const s = severity?.toLowerCase() || "";
    if (s.includes("critical") || s.includes("high")) return { id: "1" }; // Highest
    if (s.includes("major") || s.includes("medium")) return { id: "3" }; // Medium
    return { id: "5" }; // Lowest
}
