import * as fs from 'fs';
import * as path from 'path';
import { getAvailableTools } from '../lib/ai/tool-executor';
import { getSystemPrompt } from '../lib/ai/system-prompt';

// Parse .env manually
try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
} catch (e) {
  console.log("No .env file found or failed to parse");
}

async function main() {
  console.log("Direct API Test WITH NEW simplified system prompt...");
  const apiKey = process.env.GROQ_API_KEY;
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const toolsConfig = getAvailableTools({ userId: "mock-admin-id", role: "admin" });
  const formattedTools = Object.entries(toolsConfig).map(([name, t]: any) => {
    return {
      type: 'function',
      function: {
        name,
        description: t.description,
        parameters: t.parameters.jsonSchema
      }
    };
  });

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: getSystemPrompt("admin") },
      { role: 'user', content: 'What grade is Mithun registered for?' }
    ],
    tools: formattedTools,
    tool_choice: 'auto'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const resJson = await response.json();
    if (resJson.choices) {
      console.log("RAW RESPONSE choices:", JSON.stringify(resJson.choices, null, 2));
    }
    if (resJson.error) {
      console.log("ERROR:", resJson.error);
    }
  } catch (error) {
    console.error("Direct request failed:", error);
  }
}

main();
