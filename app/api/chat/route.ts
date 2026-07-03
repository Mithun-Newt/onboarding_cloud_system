import { streamText, convertToModelMessages, isStepCount } from 'ai';
import { getAIProvider } from '@/lib/ai/provider';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import { getAvailableTools } from '@/lib/ai/tool-executor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    const tools = getAvailableTools({ userId: session.user.id, role: session.user.roles[0] });

    const result = await streamText({
      model: getAIProvider(),
      system: getSystemPrompt(session.user.roles.join(', ')),
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
