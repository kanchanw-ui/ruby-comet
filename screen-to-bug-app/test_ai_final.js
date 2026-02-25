const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const supabaseUrl = "https://sfjmgsqdrlyxlmfpbsec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmam1nc3Fkcmx5eGxtZnBic2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc3MzkyMywiZXhwIjoyMDg3MzQ5OTIzfQ.LpliuzCdsmHLoqtR_dmh2flwZ7df-ixCeLeH5zWo8Ao";
const geminiKey = "AIzaSyCLXzS3mOu5jVHNLk_2YkCDhsLw7v_jjmk";

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

async function run() {
    const recordingId = 'd8dcb7ef-a694-4f1c-8108-e201101daee4';
    const { data: recording } = await supabase.from('recordings').select('*').eq('id', recordingId).single();
    const { data: videoData } = await supabase.storage.from('recordings').download(recording.storage_path);
    const arrayBuffer = await videoData.arrayBuffer();
    const base64Video = Buffer.from(arrayBuffer).toString('base64');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Analyze this video and generate a bug report.";

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Video, mimeType: "video/webm" } }
    ]);
    const response = await result.response;
    fs.writeFileSync('output.txt', response.text());
    console.log('DONE');
}

run();
