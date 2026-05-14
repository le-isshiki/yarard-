import { openai, TTS_MODEL } from './openai.js';

export async function tts(text: string): Promise<Buffer> {
  const c = openai();
  const r = await c.audio.speech.create({
    model: TTS_MODEL,
    voice: 'alloy',
    input: text,
    response_format: 'opus',
  });
  const arr = await r.arrayBuffer();
  return Buffer.from(arr);
}
