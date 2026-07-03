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

async function testModel(modelName: string) {
  console.log(`\n========================================\nTesting model: ${modelName}\n========================================`);
  try {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    const model = groq(modelName);
    const system = getSystemPrompt("admin");
    const tools = getAvailableTools({ userId: "mock-admin-id", role: "admin" });

    const result = await streamText({
      model,
      system,
      messages: [
        { role: 'user', content: 'What grade is Mithun registered for?' }
      ],
      tools,
      stopWhen: isStepCount(5),
    });

    const toolCalls = await result.toolCalls;
    console.log("Tool calls generated:", JSON.stringify(toolCalls, null, 2));

    const text = await result.text;
    console.log("Final text generated:", text);

  } catch (error) {
    console.error(`FAILED for model ${modelName}:`, error);
  }
}

async function main() {
  await testModel('llama-3.1-8b-instant');
  await testModel('llama-3.3-70b-specdec');
}

main();
