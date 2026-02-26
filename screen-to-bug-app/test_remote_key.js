async function test() {
    const r = await fetch("https://ruby-comet.vercel.app/api/gemini-key");
    const d = await r.json();
    const key = d.key;

    const genResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        {
            method: "GET",
        }
    );

    if (!genResp.ok) {
        console.error("FAILED:", genResp.status, await genResp.text());
    } else {
        const data = await genResp.json();
        console.log("SUCCESS");
    }
}

test();
