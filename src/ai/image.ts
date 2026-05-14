import { openai, IMAGE_MODEL } from './openai.js';

export async function generateImage(prompt: string): Promise<Buffer> {
  const c = openai();
  const r = await c.images.generate({
    model: IMAGE_MODEL,
    prompt,
    size: '1024x1024',
    n: 1,
  });
  const b64 = r.data?.[0]?.b64_json;
  if (!b64) throw new Error('no image data returned');
  return Buffer.from(b64, 'base64');
}
