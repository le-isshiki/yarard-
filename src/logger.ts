import pino from 'pino';
import { getConfig } from './config.js';

const cfg = getConfig();

export const logger = pino({
  level: cfg.LOG_LEVEL,
  redact: {
    paths: [
      'GROQ_API_KEY',
      'OPENAI_API_KEY',
      'DATABASE_URL',
      '*.GROQ_API_KEY',
      '*.OPENAI_API_KEY',
      '*.DATABASE_URL',
      'value',
      'creds',
      'content',
      'text',
    ],
    censor: '[REDACTED]',
  },
  base: { service: 'theseus-yarard' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function child(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
