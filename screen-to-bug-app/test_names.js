const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiKey = "AIzaSyCLXzS3mOu5jVHNLk_2YkCDhsLw7v_jjmk";
const genAI = new GoogleGenerativeAI(geminiKey);

async function test(name) {
    try {
        const model = genAI.getGenerativeModel({ model: name });
        await model.generateContent("Hi");
        console.log("SUCCESS:", name);
        return true;
    } catch (e) {
        console.log("FAIL:", name, e.status);
        return false;
    }
}

async function run() {
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash-001", "gemini-1.5-flash-002", "gemini-2.0-flash-exp", "gemini-2.0-flash"];
    for (const m of models) {
        if (await test(m)) break;
    }
}

run();
