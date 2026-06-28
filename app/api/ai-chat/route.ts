import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, page } = await req.json();

  const systemPrompt = `You are Zenith, an expert astronomical AI assistant embedded in Project Zenith: The Celestial Eye — a real-time celestial tracking web platform. The user is currently on the ${page} page. Answer questions about celestial events, ISS tracking, satellite orbits, constellations, stargazing, planetary positions, and how to use the platform. Be concise (2-4 sentences), friendly, and use space terminology naturally. If asked about a specific location or time, provide accurate astronomical context.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  const data = await response.json();
  const reply = data.content?.[0]?.text ?? 'Cosmic signal lost. Please try again.';
  return Response.json({ reply });
}
