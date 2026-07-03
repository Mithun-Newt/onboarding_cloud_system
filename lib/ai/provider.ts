import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { LanguageModel } from 'ai';

/**
 * Initializes and returns the configured AI Provider Language Model.
 * The application supports switching providers by changing environment variables.
 * Currently configured to support Groq natively as the default.
 */
export function getAIProvider(): LanguageModel {
  const provider = process.env.AI_PROVIDER || 'groq';

  if (provider === 'groq') {
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });
    
    // Defaulting to a standard open source model on Groq
    return groq(process.env.GROQ_MODEL || 'llama-3.1-8b-instant');
  }

  if (provider === 'openai') {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(process.env.OPENAI_MODEL || 'gpt-4o');
  }

  throw new Error(`Unsupported AI Provider: ${provider}`);
}
