// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message } = (req.body ?? {}) as { message?: string };

  // TODO: Replace with your real AI call (OpenAI, etc.)
  const reply = message ? `Echo: ${message}` : "Please send a message.";
  res.status(200).json({ reply });
}
