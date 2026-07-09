import { BaseAgent } from './base-agent';
import { AdmissionsAgent } from './specialists/admissions-agent';
import { FinanceAgent } from './specialists/finance-agent';
import { DocumentsAgent } from './specialists/documents-agent';
import { TransportAgent } from './specialists/transport-agent';

class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();

  constructor() {
    // Automatically register our core specialist agents
    this.register(new AdmissionsAgent());
    this.register(new FinanceAgent());
    this.register(new DocumentsAgent());
    this.register(new TransportAgent());
  }

  register(agent: BaseAgent): void {
    this.agents.set(agent.metadata().name, agent);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Discovers which agents can handle a query based on their canHandle definitions.
   */
  discoverAgentsForQuery(query: string, context: any): BaseAgent[] {
    return this.getAllAgents().filter(agent => agent.canHandle(query, context));
  }
}

export const agentRegistry = new AgentRegistry();
