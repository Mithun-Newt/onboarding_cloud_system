import { agentRegistry } from './agent-registry';
import { BaseAgent, SharedMemoryContext } from './base-agent';

export interface ExecutionPlanStep {
  agentName: string;
  querySlice: string;
  dependencies: string[]; // List of agent names that must complete before this runs
}

export interface ExecutionPlan {
  steps: ExecutionPlanStep[];
  executionMode: 'parallel' | 'sequential' | 'hybrid';
}

export class Planner {
  plan(query: string, context: SharedMemoryContext): ExecutionPlan {
    const matchedAgents = agentRegistry.discoverAgentsForQuery(query, context);
    const steps: ExecutionPlanStep[] = [];

    // If no specific agents matched, fall back to routing to the AdmissionsAgent as default
    if (matchedAgents.length === 0) {
      steps.push({
        agentName: 'AdmissionsAgent',
        querySlice: query,
        dependencies: []
      });
      return { steps, executionMode: 'sequential' };
    }

    // Determine execution mode and dependencies.
    // If query has both 'fee'/'pay' AND 'admission'/'student', AdmissionsAgent runs first to resolve identity, then Finance runs.
    const hasAdmissions = matchedAgents.some(a => a.metadata().name === 'AdmissionsAgent');
    const hasFinance = matchedAgents.some(a => a.metadata().name === 'FinanceAgent');
    const hasDocs = matchedAgents.some(a => a.metadata().name === 'DocumentsAgent');
    const hasTransport = matchedAgents.some(a => a.metadata().name === 'TransportAgent');

    // Build steps with structured dependencies
    for (const agent of matchedAgents) {
      const name = agent.metadata().name;
      const deps: string[] = [];

      if (name === 'FinanceAgent' && hasAdmissions) {
        deps.push('AdmissionsAgent'); // Finance depends on student ID resolution
      }
      if (name === 'DocumentsAgent' && hasAdmissions) {
        deps.push('AdmissionsAgent'); // Docs depends on student ID
      }
      if (name === 'TransportAgent' && hasAdmissions) {
        deps.push('AdmissionsAgent'); // Transport depends on student ID
      }

      steps.push({
        agentName: name,
        querySlice: query,
        dependencies: deps
      });
    }

    // Determine overall execution mode based on dependencies
    let executionMode: 'parallel' | 'sequential' | 'hybrid' = 'parallel';
    const hasDependencies = steps.some(s => s.dependencies.length > 0);
    const canParallel = steps.some(s => s.dependencies.length === 0) && steps.length > 1;

    if (hasDependencies && canParallel) {
      executionMode = 'hybrid';
    } else if (hasDependencies) {
      executionMode = 'sequential';
    } else if (steps.length > 1) {
      executionMode = 'parallel';
    } else {
      executionMode = 'sequential';
    }

    return { steps, executionMode };
  }
}

export const planner = new Planner();
