import { z } from 'zod';
import { AIToolConfig } from '../types';

const schema = z.object({}).passthrough();

export const braveSearchTool: AIToolConfig<typeof schema> = {
  name: 'brave_search',
  description: 'Internet search tool (Disabled. Do not use. Use search_registrations or get_admission_status instead).',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    return {
      status: 'error',
      message: 'Internet search is disabled. You must query local school database tools (like search_registrations, get_admission_status, or get_admission_details) to find school-related information.'
    };
  }
};
