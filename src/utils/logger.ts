import * as fs from 'fs';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    metadata?: any;
}

const formatMessage = (level: LogLevel, message: string, metadata?: any): string => {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';

    return `[${timestamp}] ${levelName}: ${message}${metadataStr}`;
};

const writeLog = (level: LogLevel, message: string, metadata?: any, logFile?: string): void => {
    const currentLogLevel = process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO;

    if (level > currentLogLevel) return;

    const formattedMessage = formatMessage(level, message, metadata);

    if (level <= LogLevel.ERROR) {
        console.error(formattedMessage);
    } else if (level <= LogLevel.WARN) {
        console.warn(formattedMessage);
    } else {
        console.log(formattedMessage);
    }

    if (logFile) {
        try {
            fs.appendFileSync(logFile, formattedMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
};

export const error = (message: string, metadata?: any): void => {
    writeLog(LogLevel.ERROR, message, metadata, process.env.LOG_FILE);
};

export const warn = (message: string, metadata?: any): void => {
    writeLog(LogLevel.WARN, message, metadata, process.env.LOG_FILE);
};

export const info = (message: string, metadata?: any): void => {
    writeLog(LogLevel.INFO, message, metadata, process.env.LOG_FILE);
};

export const debug = (message: string, metadata?: any): void => {
    writeLog(LogLevel.DEBUG, message, metadata, process.env.LOG_FILE);
};

export const logger = {
    error,
    warn,
    info,
    debug
};