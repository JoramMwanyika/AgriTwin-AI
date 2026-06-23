const fs = require('fs');

async function testDirect() {
  const url = "https://jorammwanyika.openai.azure.com/?api-version=2025-01-01-preview";
  const key = "your-azure-openai-key-here";

  const payload = {
    messages: [ { role: "user", content: "hi" } ]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": key
      },
      body: JSON.stringify(payload)
    });

    console.log(`Direct Status: ${res.status}`);
    const text = await res.text();
    console.log("Response text:", text);
  } catch(e) {
    console.error("Fetch error:", e);
  }
}

testDirect();
