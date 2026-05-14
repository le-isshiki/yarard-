import Groq from 'groq-sdk';
import { getConfig } from '../config.js';

let client: Groq | null = null;

export function groq(): Groq {
  if (client) return client;
  const cfg = getConfig();
  client = new Groq({ apiKey: cfg.GROQ_API_KEY });
  return client;
}

export const CHAT_MODEL = 'llama-3.3-70b-versatile';
export const WHISPER_MODEL = 'whisper-large-v3-turbo';
