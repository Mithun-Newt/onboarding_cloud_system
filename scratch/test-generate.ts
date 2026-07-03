import { getAIProvider } from '../lib/ai/provider';
import { getSystemPrompt } from '../lib/ai/system-prompt';
import { getAvailableTools } from '../lib/ai/tool-executor';
import { generateText } from 'ai';
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
  console.log("Testing generateText with native Groq provider...");
  try {
    const model = getAIProvider();
    const system = getSystemPrompt("admin");
    const tools = getAvailableTools({ userId: "mock-admin-id", role: "admin" });

    const result = await generateText({
      model,
      system,
      messages: [
        { role: 'user', content: 'search registrations for name Mithun' }
      ],
      tools,
    });

    console.log("Tool calls generated:", JSON.stringify(result.toolCalls, null, 2));
    console.log("Tool results generated:", JSON.stringify(result.toolResults, null, 2));
    console.log("Final text generated:", result.text);

  } catch (error) {
    console.error("FAILED during execution:", error);
  }
}

main();
