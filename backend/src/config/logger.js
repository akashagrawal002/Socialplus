const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
  if (stack) log += `\n${stack}`;
  return log;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        errors({ stack: true }),
        timestamp({ format: 'HH:mm:ss' }),
        logFormat
      )
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join('logs', 'combined.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10
      })
    ] : [])
  ]
});

module.exports = logger;
