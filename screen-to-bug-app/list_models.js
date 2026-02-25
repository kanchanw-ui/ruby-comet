const https = require('https');
const geminiKey = "AIzaSyCLXzS3mOu5jVHNLk_2YkCDhsLw7v_jjmk";

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(m.name));
            } else {
                console.log('No models found or error:', data);
            }
        } catch (e) {
            console.log('Parse error:', e, data);
        }
    });
}).on('error', (err) => {
    console.log('Error:', err.message);
});
