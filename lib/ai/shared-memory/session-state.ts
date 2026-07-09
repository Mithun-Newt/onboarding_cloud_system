import { SharedMemoryContext } from '../agents/base-agent';

/**
 * Parses context memory from the Next.js Chat messages history array.
 * Decoupled from PostgreSQL; runs purely on application-layer request context.
 */
export function parseSharedMemory(messages: any[]): SharedMemoryContext {
  let studentName: string | undefined;
  let admissionNo: string | undefined;
  let registrationNo: string | undefined;
  let studentId: string | undefined;
  let admissionId: string | undefined;
  let lastAgentUsed: string | undefined;
  const previousAgentOutputs: Record<string, any> = {};

  // Scan backwards through the message history
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || '');

    // 1. Regex matching for standard document and admission numbers
    const admMatch = text.match(/ADM-\d{4}-\d{4}/i);
    if (admMatch && !admissionNo) {
      admissionNo = admMatch[0].toUpperCase();
    }
    const regMatch = text.match(/REG-\d{4}-\d{4}/i);
    if (regMatch && !registrationNo) {
      registrationNo = regMatch[0].toUpperCase();
    }

    // 2. Parse from tool call arguments or custom agent outputs metadata
    if (msg.toolInvocations) {
      for (const invocation of msg.toolInvocations) {
        if (invocation.args) {
          const args = invocation.args;
          if (args.admissionNo || args.admissionNumber || args.admNo) {
            const val = args.admissionNo || args.admissionNumber || args.admNo;
            const m = String(val).match(/ADM-\d{4}-\d{4}/i);
            if (m && !admissionNo) admissionNo = m[0].toUpperCase();
          }
          if (args.registrationNo || args.registrationNumber || args.regNo) {
            const val = args.registrationNo || args.registrationNumber || args.regNo;
            const m = String(val).match(/REG-\d{4}-\d{4}/i);
            if (m && !registrationNo) registrationNo = m[0].toUpperCase();
          }
          if (args.studentName || args.name) {
            if (!studentName) studentName = args.studentName || args.name;
          }
        }
        if (invocation.result) {
          const res = invocation.result;
          const resStr = JSON.stringify(res);
          const nameMatch = resStr.match(/"studentName"\s*:\s*"([^"]+)"|"(?:fullNameEn|name)"\s*:\s*"([^"]+)"/i);
          if (nameMatch && !studentName) {
            studentName = nameMatch[1] || nameMatch[2];
          }
          // Extract specific IDs if available in tool outputs
          if (res.studentId && !studentId) studentId = res.studentId;
          if (res.admissionId && !admissionId) admissionId = res.admissionId;
        }
      }
    }

    // 3. Scan tool outputs/messages directly
    if (msg.role === 'tool') {
      const nameMatch = text.match(/"studentName"\s*:\s*"([^"]+)"|"(?:fullNameEn|name)"\s*:\s*"([^"]+)"/i);
      if (nameMatch && !studentName) {
        studentName = nameMatch[1] || nameMatch[2];
      }
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed.studentId && !studentId) studentId = parsed.studentId;
        if (parsed.admissionId && !admissionId) admissionId = parsed.admissionId;
        if (parsed.agentName && !lastAgentUsed) lastAgentUsed = parsed.agentName;
        if (parsed.agentOutput) {
          previousAgentOutputs[parsed.agentName || 'unknown'] = parsed.agentOutput;
        }
      } catch (e) {
        // Safe to ignore non-JSON tool output strings
      }
    }
  }

  return {
    studentId,
    studentName,
    admissionId,
    admissionNo,
    registrationNo,
    lastAgentUsed,
    previousAgentOutputs
  };
}
