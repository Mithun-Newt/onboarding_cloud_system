import { z } from 'zod';

export type AIProvider = 'groq' | 'openai' | 'gemini' | 'openrouter';

export interface AIToolConfig<T extends z.ZodTypeAny = any, R = any> {
  name: string;
  description: string;
  schema: T;
  execute: (args: z.infer<T>, context?: ExecutionContext) => Promise<R>;
  isReadOnly: boolean;
}

export type ToolRegistry = Record<string, AIToolConfig>;

export interface ExecutionContext {
  userId?: string;
  role?: string;
}
