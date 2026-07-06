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

    // 1. Extract conversational context (student, admission, registration) from message history
    let studentName: string | undefined;
    let admissionNo: string | undefined;
    let registrationNo: string | undefined;

    // Scan backwards from most recent message
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || '');

      // Regex matches
      const admMatch = text.match(/ADM-\d{4}-\d{4}/i);
      if (admMatch && !admissionNo) {
        admissionNo = admMatch[0].toUpperCase();
      }
      const regMatch = text.match(/REG-\d{4}-\d{4}/i);
      if (regMatch && !registrationNo) {
        registrationNo = regMatch[0].toUpperCase();
      }

      // Scan tool outputs/invocations
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
            const resStr = JSON.stringify(invocation.result);
            const nameMatch = resStr.match(/"studentName"\s*:\s*"([^"]+)"|"(?:fullNameEn|name)"\s*:\s*"([^"]+)"/i);
            if (nameMatch && !studentName) {
              studentName = nameMatch[1] || nameMatch[2];
            }
          }
        }
      }

      if (msg.role === 'tool') {
        const nameMatch = text.match(/"studentName"\s*:\s*"([^"]+)"|"(?:fullNameEn|name)"\s*:\s*"([^"]+)"/i);
        if (nameMatch && !studentName) {
          studentName = nameMatch[1] || nameMatch[2];
        }
      }
    }

    const tools = getAvailableTools({ userId: session.user.id, role: session.user.roles[0] });

    let systemPrompt = getSystemPrompt(session.user.roles.join(', '));
    if (studentName || admissionNo || registrationNo) {
      systemPrompt += `\n\nActive Conversation Context:\n` +
        (studentName ? `- Student Name: ${studentName}\n` : '') +
        (admissionNo ? `- Admission No: ${admissionNo}\n` : '') +
        (registrationNo ? `- Registration No: ${registrationNo}\n` : '') +
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
