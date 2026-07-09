import { generateText } from 'ai';
import { getAIProvider } from '@/lib/ai/provider';
import { BaseAgent, AgentMetadata, AgentExecutionResult, SharedMemoryContext } from './base-agent';
import { planner, ExecutionPlan } from './planner';
import { agentRegistry } from './agent-registry';

export interface CoordinatorTraceLog {
  query: string;
  plannerPlan: ExecutionPlan;
  executionSteps: {
    agentName: string;
    success: boolean;
    confidence: number;
    durationMs: number;
    reasoning: string;
    recommendations: string[];
    data: any;
  }[];
  overallDurationMs: number;
  modeUsed: string;
}

export class CoordinatorAgent {
  metadata(): AgentMetadata {
    return {
      name: 'CoordinatorAgent',
      domain: 'Orchestration & Routing',
      description: 'Coordinates specialist agents, schedules execution paths, and synthesizes overall responses.',
      supportedCapabilities: ['agent_orchestration', 'intent_routing', 'response_synthesis'],
      toolsOwned: []
    };
  }

  async executeQuery(query: string, context: SharedMemoryContext): Promise<{ response: string; trace: CoordinatorTraceLog }> {
    const startOverall = Date.now();
    
    // 1. Planner decides which specialists to run initially
    const plan = planner.plan(query, context);
    const traceSteps: CoordinatorTraceLog['executionSteps'] = [];
    const executed = new Set<string>();

    // Helper to run agent with caching/skipping
    const executeAgent = async (agentName: string) => {
      if (executed.has(agentName)) {
        console.log(`[Coordinator] Skipping already executed agent: ${agentName}`);
        return;
      }
      const agent = agentRegistry.getAgent(agentName);
      if (agent) {
        executed.add(agentName);
        const res = await agent.execute(query, context);
        traceSteps.push({
          agentName: res.agent,
          success: res.success,
          confidence: res.confidence,
          durationMs: res.executionTimeMs,
          reasoning: res.reasoning,
          recommendations: res.recommendations,
          data: res.data
        });
        context.lastAgentUsed = res.agent;
        context.previousAgentOutputs[res.agent] = res.data;
      }
    };

    // 2. Execute according to plan's execution mode
    if (plan.executionMode === 'parallel') {
      const promises = plan.steps.map(step => executeAgent(step.agentName));
      await Promise.all(promises);
    } else {
      // Sequential & Hybrid
      for (const step of plan.steps) {
        await executeAgent(step.agentName);
      }
    }

    // 3. Dynamic Agent Selection (Multi-Agent Collaboration Loops)
    let dynamicLoops = 0;
    while (dynamicLoops < 2) {
      let nextAgent: string | null = null;
      
      // Dynamic heuristics based on gathered data in current lifecycle
      if (context.studentName || context.studentId) {
        const qLower = query.toLowerCase();
        
        // If we queried student details but haven't checked document blocker files:
        if (!executed.has('DocumentsAgent') && (qLower.includes('admit') || qLower.includes('block') || qLower.includes('ready') || qLower.includes('complete'))) {
          nextAgent = 'DocumentsAgent';
        }
        // If we queried student/admission details but haven't verified outstanding billing logs:
        else if (!executed.has('FinanceAgent') && (qLower.includes('pay') || qLower.includes('fee') || qLower.includes('due') || qLower.includes('balance'))) {
          nextAgent = 'FinanceAgent';
        }
      }

      if (nextAgent) {
        console.log(`[Coordinator] Dynamically invoking specialist agent: ${nextAgent}`);
        await executeAgent(nextAgent);
      } else {
        break;
      }
      dynamicLoops++;
    }

    const duration = Date.now() - startOverall;

    const trace: CoordinatorTraceLog = {
      query,
      plannerPlan: plan,
      executionSteps: traceSteps,
      overallDurationMs: duration,
      modeUsed: plan.executionMode
    };

    // Log trace to console (for development environments)
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n=== MULTI-AGENT EXECUTION TRACE ===');
      console.log(JSON.stringify(trace, null, 2));
      console.log('===================================\n');
    }

    // 4. Coordinator cross-domain reasoning & response synthesis
    let responseMessage = '';
    try {
      const { text } = await generateText({
        model: getAIProvider(),
        system: `You are the Coordinator Agent for a school admissions and operations portal.
Your job is to synthesize outputs from specialized domain agents into a unified, clear, and professional response.

You MUST produce a response structured with the following parts (clearly formatted using Markdown headers):
### Analysis & Recommendations
- **Reason**: The business reason / purpose of this analysis.
- **Evidence**: Specific data points gathered from the specialist agents.
- **Risk**: Any risks identified (e.g. outstanding fees, missing documents, seat capacity limits).
- **Recommendation**: Exact next steps for the school staff.
- **Expected Outcome**: The expected business benefit of taking this action.`,
        prompt: `User Query: "${query}"

Specialist Agent Outputs:
${traceSteps.map(s => `
- Agent: ${s.agentName}
  Success: ${s.success}
  Confidence: ${s.confidence}
  Reasoning: ${s.reasoning}
  Recommendations: ${JSON.stringify(s.recommendations)}
  Data: ${JSON.stringify(s.data)}
`).join('\n')}`,
      });
      responseMessage = text;
    } catch (err: any) {
      responseMessage = `### Analysis & Recommendations\n- **Reason**: Handle query.\n- **Evidence**: Failed synthesis, falling back.\n- **Risk**: None.\n- **Recommendation**: Check logs.\n- **Expected Outcome**: Clean audit.`;
    }

    return {
      response: responseMessage,
      trace
    };
  }
}

export const coordinatorAgent = new CoordinatorAgent();
