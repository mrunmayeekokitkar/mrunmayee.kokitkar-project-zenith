import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, page } = await req.json();

  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: 'Zenith AI is currently offline. Configure ANTHROPIC_API_KEY to enable cosmic intelligence.'
    });
  }

  const systemPrompt = `You are Zenith, an expert astronomical AI assistant embedded in Project Zenith: The Celestial Eye — a real-time celestial tracking web platform. The user is currently on the ${page} page. Answer questions about celestial events, ISS tracking, satellite orbits, constellations, stargazing, planetary positions, and how to use the platform. Be concise (2-4 sentences), friendly, and use space terminology naturally. If asked about a specific location or time, provide accurate astronomical context.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? 'Cosmic signal lost. Please try again.';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({
      reply: 'Cosmic signal interrupted. Please try again.'
    });
  }
}
