import * as fs from 'fs';
import * as path from 'path';

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

class Logger {
    private logLevel: LogLevel;
    private logFile?: string;

    constructor(level: LogLevel = LogLevel.INFO, logFile?: string) {
        this.logLevel = level;
        this.logFile = logFile;
    }

    private formatMessage(level: LogLevel, message: string, metadata?: any): string {
        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level];
        const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';

        return `[${timestamp}] ${levelName}: ${message}${metadataStr}`;
    }

    private writeLog(level: LogLevel, message: string, metadata?: any): void {
        if (level > this.logLevel) return;

        const formattedMessage = this.formatMessage(level, message, metadata);

        // Console output
        if (level <= LogLevel.ERROR) {
            console.error(formattedMessage);
        } else if (level <= LogLevel.WARN) {
            console.warn(formattedMessage);
        } else {
            console.log(formattedMessage);
        }

        // File output (if configured)
        if (this.logFile) {
            try {
                fs.appendFileSync(this.logFile, formattedMessage + '\n');
            } catch (error) {
                console.error('Failed to write to log file:', error);
            }
        }
    }

    public error(message: string, metadata?: any): void {
        this.writeLog(LogLevel.ERROR, message, metadata);
    }

    public warn(message: string, metadata?: any): void {
        this.writeLog(LogLevel.WARN, message, metadata);
    }

    public info(message: string, metadata?: any): void {
        this.writeLog(LogLevel.INFO, message, metadata);
    }

    public debug(message: string, metadata?: any): void {
        this.writeLog(LogLevel.DEBUG, message, metadata);
    }
}

export const logger = new Logger(
    process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO,
    process.env.LOG_FILE
);
