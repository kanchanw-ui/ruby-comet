async function testGemini() {
    const geminiKey = "AIzaSyCLXzS3mOu5jVHNLk_2YkCDhsLw7v_jjmk";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

testGemini();
