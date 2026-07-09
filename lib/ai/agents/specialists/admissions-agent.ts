import { streamText, isStepCount } from 'ai';
import { getAIProvider } from '@/lib/ai/provider';
import { getAvailableTools } from '@/lib/ai/tool-executor';
import { BaseAgent, AgentMetadata, AgentExecutionResult, SharedMemoryContext } from '../base-agent';

export class AdmissionsAgent implements BaseAgent {
  metadata(): AgentMetadata {
    return {
      name: 'AdmissionsAgent',
      domain: 'Admissions & Registrations',
      description: 'Handles student profiles, seat capacities, registration conversions, and admission status workflows.',
      supportedCapabilities: ['search_student', 'check_capacity', 'conversion_funnel', 'admission_timeline'],
      toolsOwned: [
        'search_registrations',
        'get_admission_details',
        'get_admission_status',
        'check_seat_capacity',
        'get_occupancy_predictions',
        'get_registration_conversion_analysis'
      ]
    };
  }

  canHandle(query: string): boolean {
    const q = query.toLowerCase();
    return q.includes('admit') || q.includes('admission') || q.includes('register') || q.includes('capacity') || q.includes('seat') || q.includes('student');
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

      // Update context memory based on agent execution result
      if (parsedResult.data?.studentName && !context.studentName) {
        context.studentName = parsedResult.data.studentName;
      }
      if (parsedResult.data?.studentId && !context.studentId) {
        context.studentId = parsedResult.data.studentId;
      }
      if (parsedResult.data?.admissionNo && !context.admissionNo) {
        context.admissionNo = parsedResult.data.admissionNo;
      }

      return {
        agent: this.metadata().name,
        success: parsedResult.success ?? true,
        confidence: parsedResult.confidence ?? 0.95,
        executionTimeMs: Date.now() - start,
        reasoning: parsedResult.reasoning || "Executed admissions query successfully.",
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
