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
  try {
    const groq = createGroq({ 
      apiKey: process.env.GROQ_API_KEY,
      fetch: async (url, options: any) => {
        const bodyObj = JSON.parse(options.body);
        console.log("ALL REQUEST TOOLS:", JSON.stringify(bodyObj.tools, null, 2));
        // Return dummy/empty response to prevent actual API call since we only want payload
        return new Response(JSON.stringify({ choices: [] }), { status: 200 });
      }
    });
    const model = groq('llama-3.1-8b-instant');
    const system = getSystemPrompt("admin");
    const tools = getAvailableTools({ userId: "mock-admin-id", role: "admin" });

    await streamText({
      model,
      system,
      messages: [
        { role: 'user', content: 'What grade is Mithun registered for?' }
      ],
      tools,
      stopWhen: isStepCount(1),
    }).text;

  } catch (error: any) {
    // Ignore error
  }
}

main();
