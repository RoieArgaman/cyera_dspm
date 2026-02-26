import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.resolve(__dirname, '../logs');
fs.mkdirSync(logsDir, { recursive: true });

const logLevel = process.env.LOG_LEVEL || 'info';

const consolePrintf = winston.format.printf(
  ({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  }
);

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports: [
    new winston.transports.Console({
      level: logLevel,
      stderrLevels: ['error', 'warn'],
      format: winston.format.combine(
        winston.format.colorize(),
        consolePrintf
      ),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'run.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      stderrLevels: ['error'],
      format: winston.format.combine(
        winston.format.colorize(),
        consolePrintf
      ),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      stderrLevels: ['error'],
      format: winston.format.combine(
        winston.format.colorize(),
        consolePrintf
      ),
    }),
  ],
});

