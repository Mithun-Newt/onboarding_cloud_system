import { createGroq } from '@ai-sdk/groq';
import { getSystemPrompt } from '../lib/ai/system-prompt';
import { getAvailableTools } from '../lib/ai/tool-executor';
import { streamText, isStepCount } from 'ai';
import * as fs from 'fs';
import * as path from 'path';

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
  console.log("Testing native Groq provider query...");
  try {
    const groq = createGroq({ 
      apiKey: process.env.GROQ_API_KEY,
      fetch: async (url, options: any) => {
        const bodyObj = JSON.parse(options.body);
        console.log("---- GOING TO FETCH FROM GROQ ----");
        console.log("MESSAGES:", JSON.stringify(bodyObj.messages, null, 2));
        console.log("TOOLS COUNT:", bodyObj.tools?.length);
        const res = await fetch(url, options);
        const clonedRes = res.clone();
        const resText = await clonedRes.text();
        console.log("---- GROQ RESPONSE STATUS:", res.status);
        console.log("---- GROQ RESPONSE TEXT:", resText);
        return res;
      }
    });
    const model = groq('llama-3.1-8b-instant');
    const system = getSystemPrompt("admin");
    const tools = getAvailableTools({ userId: "mock-admin-id", role: "admin" });

    const result = await streamText({
      model,
      system,
      messages: [
        { role: 'user', content: 'provide me the primary contact number of this REG-2026-0008 registration' }
      ],
      tools,
      maxSteps: 5,
      stopWhen: isStepCount(5),
    });

    console.log("Checking tool calls...");
    const toolCalls = await result.toolCalls;
    console.log("Tool calls generated:", toolCalls);

    const text = await result.text;
    console.log("Final text generated:", text);

  } catch (error: any) {
    console.error("FAILED during execution:", error);
  }
}

main();
