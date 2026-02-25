const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiKey = "AIzaSyCLXzS3mOu5jVHNLk_2YkCDhsLw7v_jjmk";
const genAI = new GoogleGenerativeAI(geminiKey);

async function listModels() {
    try {
        // There isn't a direct listModels in the standard SDK easily accessible without additional scopes often
        // but we can try a simple generation with a safer model name
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("Success with gemini-1.5-flash");
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", e.status, e.message);
    }
}

listModels();
