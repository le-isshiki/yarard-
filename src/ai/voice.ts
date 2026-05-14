import { downloadMediaMessage, type WAMessage } from '@whiskeysockets/baileys';
import { groq, WHISPER_MODEL } from './groq.js';
import { logger } from '../logger.js';

export async function transcribe(msg: WAMessage): Promise<string | null> {
  try {
    const buf = (await downloadMediaMessage(msg, 'buffer', {})) as Buffer;
    if (!buf || buf.length === 0) return null;

    const file = new File([new Uint8Array(buf)], 'audio.ogg', { type: 'audio/ogg' });
    const c = groq();
    const result = await c.audio.transcriptions.create({
      file: file as unknown as File,
      model: WHISPER_MODEL,
      response_format: 'text',
    });
    return typeof result === 'string'
      ? result
      : (result as { text: string }).text;
  } catch (err) {
    logger.warn({ err }, 'whisper transcription failed');
    return null;
  }
}
