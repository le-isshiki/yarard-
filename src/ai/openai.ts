import OpenAI from 'openai';
import { getConfig } from '../config.js';

let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (client) return client;
  const cfg = getConfig();
  client = new OpenAI({ apiKey: cfg.OPENAI_API_KEY });
  return client;
}

export const IMAGE_MODEL = 'gpt-image-1';
export const TTS_MODEL = 'tts-1';
