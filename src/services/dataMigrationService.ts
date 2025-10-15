import { FileModel, IFile } from '../models/fileModel';
import { createReadStream, statSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import mime from 'mime-types';
import { logger } from '../utils/logger';

// Utility functions
const readFileContent = async (filePath: string): Promise<string> => {
    try {
        const stream = createReadStream(filePath, { encoding: 'utf8' });
        let content = '';

        for await (const chunk of stream) {
            content += chunk;
        }

        return content;
    } catch (error) {
        logger.error(`Error reading file ${filePath}: ${error}`);
        return '';
    }
};

const generateTags = (path: string): string[] => {
    const tags: string[] = [];

    if (path.includes('test')) tags.push('test');
    if (path.includes('log')) tags.push('log');
    if (path.includes('error')) tags.push('error');
    if (path.includes('debug')) tags.push('debug');
    if (path.includes('integration')) tags.push('integration');
    if (path.includes('unit')) tags.push('unit');
    if (path.includes('e2e')) tags.push('e2e');
    if (path.includes('performance')) tags.push('performance');
    if (path.includes('security')) tags.push('security');

    return tags;
};

const migrateDirectory = async (fsPath: string, mongoPath: string): Promise<void> => {
    try {
        const stats = statSync(fsPath);

        if (stats.isDirectory()) {
            // Create directory entry in MongoDB
            const parentPath = mongoPath === '/' ? undefined : dirname(mongoPath);

            const directory = new FileModel({
                name: basename(mongoPath) || 'root',
                path: mongoPath,
                isFolder: true,
                size: 0,
                parentPath: parentPath
            });

            await directory.save();
            logger.debug(`Created directory: ${mongoPath}`);

            // Process directory contents
            const contents = readdirSync(fsPath);
            for (const item of contents) {
                const itemFsPath = join(fsPath, item);
                const itemMongoPath = mongoPath === '/' ? `/${item}` : `${mongoPath}/${item}`;

                await migrateDirectory(itemFsPath, itemMongoPath);
            }
        } else {
            // Create file entry in MongoDB
            const content = await readFileContent(fsPath);
            const mimeType = mime.lookup(fsPath) || 'text/plain';
            const parentPath = mongoPath === '/' ? undefined : dirname(mongoPath);

            const file = new FileModel({
                name: basename(mongoPath),
                path: mongoPath,
                isFolder: false,
                size: stats.size,
                mimeType: mimeType,
                content: content,
                parentPath: parentPath,
                metadata: {
                    description: `Test file: ${basename(mongoPath)}`,
                    tags: generateTags(mongoPath),
                    author: 'Test System',
                    version: '1.0.0'
                }
            });

            await file.save();
            logger.debug(`Created file: ${mongoPath} (${stats.size} bytes)`);
        }
    } catch (error) {
        logger.error(`Error migrating ${fsPath} to ${mongoPath}: ${error}`);
    }
};

// Main service functions
export const migrateFileSystemToMongoDB = async (dataDir: string): Promise<void> => {
    try {
        logger.info('Starting data migration from file system to MongoDB...');

        // Clear existing data
        await FileModel.deleteMany({});
        logger.info('Cleared existing MongoDB data');

        // Start migration from root directory
        await migrateDirectory(dataDir, '/');

        console.log('Data migration completed successfully');
    } catch (error) {
        console.error('Error during data migration:', error);
        throw error;
    }
};

export const getMigrationStats = async (): Promise<{
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
}> => {
    try {
        const files = await FileModel.find({ isFolder: false });
        const directories = await FileModel.find({ isFolder: true });

        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        return {
            totalFiles: files.length,
            totalDirectories: directories.length,
            totalSize
        };
    } catch (error) {
        logger.error('Error getting migration stats:', error);
        throw error;
    }
};

export const verifyMigration = async (): Promise<boolean> => {
    try {
        const rootExists = await FileModel.findOne({ path: '/' });
        if (!rootExists) {
            logger.error('Root directory not found in MongoDB');
            return false;
        }

        const totalItems = await FileModel.countDocuments();
        if (totalItems === 0) {
            logger.error('No items found in MongoDB');
            return false;
        }

        logger.info(`Migration verification passed: ${totalItems} items found`);
        return true;
    } catch (error) {
        logger.error('Error verifying migration:', error);
        return false;
    }
};

// Legacy class export for backward compatibility
export class DataMigrationService {
    static migrateFileSystemToMongoDB = migrateFileSystemToMongoDB;
    static getMigrationStats = getMigrationStats;
    static verifyMigration = verifyMigration;
}