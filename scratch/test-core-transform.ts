import { getAvailableTools } from '../lib/ai/tool-executor';
import { streamText, isStepCount } from 'ai';

async function main() {
  const tools = getAvailableTools({ userId: 'mock', role: 'admin' });

  // Create a mock language model implementing LanguageModelV1 (version v4)
  const mockModel: any = {
    specificationVersion: 'v4',
    provider: 'mock',
    modelId: 'mock',
    doStream: async (options: any) => {
      console.log("CORE PASSED TOOLS TO PROVIDER:", JSON.stringify(options.tools, null, 2));
      return {
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'text-delta', delta: 'Hello' });
            controller.close();
          }
        }),
        rawResponse: { headers: {} }
      };
    }
  };

  try {
    await streamText({
      model: mockModel,
      messages: [{ role: 'user', content: 'hello' }],
      tools,
      stopWhen: isStepCount(1),
    }).text;
  } catch (e) {
    console.error("Stream failed:", e);
  }
}

main();
