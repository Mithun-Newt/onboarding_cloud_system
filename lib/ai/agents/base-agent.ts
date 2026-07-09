export interface AgentMetadata {
  name: string;
  domain: string;
  description: string;
  supportedCapabilities: string[];
  toolsOwned: string[];
}

export interface SharedMemoryContext {
  studentId?: string;
  studentName?: string;
  admissionId?: string;
  admissionNo?: string;
  registrationNo?: string;
  lastAgentUsed?: string;
  previousAgentOutputs: Record<string, any>;
}

export interface AgentExecutionResult {
  agent: string;
  success: boolean;
  confidence: number;
  executionTimeMs: number;
  reasoning: string;
  recommendations: string[];
  data: any;
}

export interface BaseAgent {
  metadata(): AgentMetadata;
  canHandle(query: string, context: SharedMemoryContext): boolean;
  execute(query: string, context: SharedMemoryContext): Promise<AgentExecutionResult>;
}
