import { streamText, isStepCount } from 'ai';
import { getAIProvider } from '@/lib/ai/provider';
import { getAvailableTools } from '@/lib/ai/tool-executor';
import { BaseAgent, AgentMetadata, AgentExecutionResult, SharedMemoryContext } from '../base-agent';

export class FinanceAgent implements BaseAgent {
  metadata(): AgentMetadata {
    return {
      name: 'FinanceAgent',
      domain: 'Finance, Fees & Billing',
      description: 'Handles parent fee collections, payment logs, outstanding balance checks, and outstanding due analysis.',
      supportedCapabilities: ['fee_check', 'outstanding_ledgers', 'pareto_recovery', 'billing_summary'],
      toolsOwned: ['get_pending_dues', 'generate_collection_report', 'get_fee_recovery_analysis']
    };
  }

  canHandle(query: string): boolean {
    const q = query.toLowerCase();
    return q.includes('fee') || q.includes('payment') || q.includes('due') || q.includes('pay') || q.includes('billing') || q.includes('outstanding');
  }

  async execute(query: string, context: SharedMemoryContext): Promise<AgentExecutionResult> {
    const start = Date.now();
    const allTools = getAvailableTools();
    const agentTools: Record<string, any> = {};

    for (const toolName of this.metadata().toolsOwned) {
      if (allTools[toolName]) {
        agentTools[toolName] = allTools[toolName];
      }
    }

    try {
      const result = await streamText({
        model: getAIProvider(),
        system: `You are the ${this.metadata().name}. Domain: ${this.metadata().domain}.
Role: ${this.metadata().description}

Active Context:
- Student ID: ${context.studentId || 'None'}
- Student Name: ${context.studentName || 'None'}
- Admission No: ${context.admissionNo || 'None'}
- Registration No: ${context.registrationNo || 'None'}

Instructions:
1. Always analyze the query.
2. Execute your available tools to retrieve facts/data. Never fabricate information.
3. You MUST respond ONLY with a JSON object matching this exact schema:
{
  "success": true,
  "confidence": 0.95,
  "reasoning": "Explain step-by-step how you used tools or analyzed data",
  "recommendations": ["list of recommendations if applicable"],
  "data": { ... key-value pairs containing the retrieved data ... }
}
Do not write any markdown formatting, only valid JSON.`,
        prompt: query,
        tools: agentTools,
        stopWhen: isStepCount(3),
      });

      const text = await result.text;
      let parsedResult: any;
      try {
        const cleaned = text.replace(/```json\n?|```/g, '').trim();
        parsedResult = JSON.parse(cleaned);
      } catch (e) {
        parsedResult = {
          success: true,
          confidence: 0.85,
          reasoning: "Extracted information from model response text.",
          recommendations: [],
          data: { response: text }
        };
      }

      return {
        agent: this.metadata().name,
        success: parsedResult.success ?? true,
        confidence: parsedResult.confidence ?? 0.95,
        executionTimeMs: Date.now() - start,
        reasoning: parsedResult.reasoning || "Executed finance query successfully.",
        recommendations: parsedResult.recommendations || [],
        data: parsedResult.data || {}
      };
    } catch (err: any) {
      return {
        agent: this.metadata().name,
        success: false,
        confidence: 0.0,
        executionTimeMs: Date.now() - start,
        reasoning: `Error during execution: ${err?.message || err}`,
        recommendations: [],
        data: {}
      };
    }
  }
}
