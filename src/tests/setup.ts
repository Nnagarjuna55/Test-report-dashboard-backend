import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
export const TEST_DATA_DIR = path.join(__dirname, '../data/test');
export const TEST_PORT = 5001;

// Setup test environment
beforeAll(async () => {
    // Create test data directory
    if (!fs.existsSync(TEST_DATA_DIR)) {
        fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
});

afterAll(async () => {
    // Cleanup test data directory
    if (fs.existsSync(TEST_DATA_DIR)) {
        fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
});

beforeEach(() => {
    // Reset test environment before each test
    process.env.NODE_ENV = 'test';
    process.env.DATA_DIR = TEST_DATA_DIR;
});

afterEach(() => {
    // Cleanup after each test
    if (fs.existsSync(TEST_DATA_DIR)) {
        const files = fs.readdirSync(TEST_DATA_DIR);
        files.forEach(file => {
            const filePath = path.join(TEST_DATA_DIR, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(filePath);
            }
        });
    }
});

// Test utilities
export const createTestFile = (filename: string, content: string): string => {
    const filePath = path.join(TEST_DATA_DIR, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
};

export const createTestDirectory = (dirname: string): string => {
    const dirPath = path.join(TEST_DATA_DIR, dirname);
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
};

export const cleanupTestFile = (filePath: string): void => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

export const cleanupTestDirectory = (dirPath: string): void => {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
};

