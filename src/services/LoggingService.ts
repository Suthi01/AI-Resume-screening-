import pino from 'pino';

/**
 * Structured JSON logger using pino.
 * In development, pipes through pino-pretty for human-readable output.
 */
const isProduction = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level,
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
});
