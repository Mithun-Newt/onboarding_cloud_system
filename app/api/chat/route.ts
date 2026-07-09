import { streamText, convertToModelMessages, isStepCount } from 'ai';
import { getAIProvider } from '@/lib/ai/provider';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import { getAvailableTools } from '@/lib/ai/tool-executor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { parseSharedMemory } from '@/lib/ai/shared-memory/session-state';
import { coordinatorAgent } from '@/lib/ai/agents/coordinator-agent';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // 1. Run Sprint 3A Coordinator Agent pipeline as the entry point
    const context = parseSharedMemory(messages);
    const coordResult = await coordinatorAgent.executeQuery(lastUserMessage, context);

    const tools = getAvailableTools({ userId: session.user.id, role: session.user.roles[0] });

    let systemPrompt = getSystemPrompt(session.user.roles.join(', '));
    systemPrompt += `\n\n### Multi-Agent Analysis & Recommendations Context:\n${coordResult.response}\n\nPresent this analysis to the user. Maintain the exact markdown structures and recommendations.`;
    if (context.studentName || context.admissionNo || context.registrationNo) {
      systemPrompt += `\n\nActive Conversation Context:\n` +
        (context.studentName ? `- Student Name: ${context.studentName}\n` : '') +
        (context.admissionNo ? `- Admission No: ${context.admissionNo}\n` : '') +
        (context.registrationNo ? `- Registration No: ${context.registrationNo}\n` : '') +
        `Use this context to resolve pronouns like "he", "she", "his", "her", "they" or follow-up questions referencing a student.`;
    }

    const result = await streamText({
      model: getAIProvider(),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: isStepCount(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('AI_CHAT_ERROR:', error);
    if (error && typeof error === 'object') {
      console.error('ERROR DETAILS:', JSON.stringify(error, null, 2));
      if (error.cause) {
        console.error('ERROR CAUSE:', JSON.stringify(error.cause, null, 2));
      }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
