import { FileModel, IFile } from '../models/fileModel';
import archiver from 'archiver';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as pathModule from 'path';
import mongoose from 'mongoose';

// Utility functions
const normalizePath = (path: string): string => {
    if (!path || path === '/') return '/';
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
};

const getParentPath = (path: string): string => {
    if (path === '/') return '';
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
};

const getDirectoryContentsFromFileSystem = async (path: string): Promise<IFile[]> => {
    const dataDir = process.env.DATA_DIR || '/data';
    const fullPath = path === '/' ? dataDir : pathModule.join(dataDir, path);

    try {
        if (!fs.existsSync(fullPath)) {
            return [];
        }

        const stats = fs.statSync(fullPath);
        if (!stats.isDirectory()) {
            return [];
        }

        const items = fs.readdirSync(fullPath);
        const contents: IFile[] = [];

        for (const item of items) {
            const itemPath = pathModule.join(fullPath, item);
            const itemStats = fs.statSync(itemPath);
            const relativePath = path === '/' ? `/${item}` : `${path}/${item}`;

            contents.push({
                name: item,
                path: relativePath,
                isFolder: itemStats.isDirectory(),
                size: itemStats.size,
                mimeType: itemStats.isDirectory() ? 'directory' : 'text/plain',
                content: itemStats.isDirectory() ? '' : fs.readFileSync(itemPath, 'utf8'),
                parentPath: path,
                createdAt: itemStats.birthtime,
                updatedAt: itemStats.mtime,
                metadata: {
                    description: `Test ${itemStats.isDirectory() ? 'directory' : 'file'}: ${item}`,
                    tags: [itemStats.isDirectory() ? 'directory' : 'file'],
                    author: 'Test System',
                    version: '1.0.0'
                }
            } as any);
        }

        return contents;
    } catch (error) {
        console.error('Error reading file system:', error);
        return [];
    }
};

const searchFilesInFileSystem = async (query: string, limit: number = 50): Promise<IFile[]> => {
    const dataDir = process.env.DATA_DIR || '/data';
    const results: IFile[] = [];

    try {
        const searchInDirectory = async (dirPath: string, currentPath: string = ''): Promise<void> => {
            if (results.length >= limit) return;

            const items = fs.readdirSync(dirPath);

            for (const item of items) {
                if (results.length >= limit) break;

                const itemPath = pathModule.join(dirPath, item);
                const itemStats = fs.statSync(itemPath);
                const relativePath = currentPath === '' ? `/${item}` : `${currentPath}/${item}`;

                // Check if item matches search query
                if (item.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        name: item,
                        path: relativePath,
                        isFolder: itemStats.isDirectory(),
                        size: itemStats.size,
                        mimeType: itemStats.isDirectory() ? 'directory' : 'text/plain',
                        content: itemStats.isDirectory() ? '' : fs.readFileSync(itemPath, 'utf8'),
                        parentPath: currentPath || '/',
                        createdAt: itemStats.birthtime,
                        updatedAt: itemStats.mtime,
                        metadata: {
                            description: `Test ${itemStats.isDirectory() ? 'directory' : 'file'}: ${item}`,
                            tags: [itemStats.isDirectory() ? 'directory' : 'file'],
                            author: 'Test System',
                            version: '1.0.0'
                        }
                    } as any);
                }

                // Recursively search subdirectories
                if (itemStats.isDirectory()) {
                    await searchInDirectory(itemPath, relativePath);
                }
            }
        };

        await searchInDirectory(dataDir);
        return results.slice(0, limit);
    } catch (error) {
        console.error('Error searching file system:', error);
        return [];
    }
};

const createZipArchive = async (path: string): Promise<Readable> => {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const stream = new Readable();

        archive.on('error', (err) => {
            reject(err);
        });

        archive.on('end', () => {
            stream.push(null);
        });

        addDirectoryToArchive(archive, path, path);

        archive.finalize();
        archive.pipe(stream as any);
        resolve(stream);
    });
};

const addDirectoryToArchive = async (archive: archiver.Archiver, dirPath: string, rootPath: string): Promise<void> => {
    try {
        const contents = await FileModel.find({ parentPath: dirPath });

        for (const item of contents) {
            if (item.isFolder) {
                await addDirectoryToArchive(archive, item.path, rootPath);
            } else {
                const relativePath = item.path.replace(rootPath, '').substring(1);
                archive.append(item.content || '', { name: relativePath });
            }
        }
    } catch (error) {
        console.error('Error adding directory to archive:', error);
    }
};

// Main service functions
export const getDirectoryContents = async (path: string): Promise<IFile[]> => {
    try {
        const normalizedPath = normalizePath(path);

        // Try MongoDB first if connected
        try {
            if (mongoose.connection.readyState === 1) {
                const contents = await FileModel.find({ parentPath: normalizedPath }).sort({ isFolder: -1, name: 1 });
                if (contents && contents.length > 0) {
                    return contents;
                }
            }
        } catch (mongoError) {
            console.log('MongoDB not available, using file system directly');
        }

        // Fallback to file system
        return getDirectoryContentsFromFileSystem(normalizedPath);
    } catch (error) {
        console.error('Error getting directory contents:', error);
        throw new Error('Failed to get directory contents');
    }
};

export const getFileContent = async (path: string): Promise<string> => {
    try {
        const normalizedPath = normalizePath(path);

        // Try MongoDB first if connected
        try {
            if (mongoose.connection.readyState === 1) {
                const file = await FileModel.findOne({ path: normalizedPath });
                if (file && !file.isFolder) {
                    return file.content || '';
                }
            }
        } catch (mongoError) {
            console.log('MongoDB not available, using file system directly');
        }

        // Fallback to file system
        const dataDir = process.env.DATA_DIR || '/data';
        const fullPath = normalizedPath === '/' ? dataDir : pathModule.join(dataDir, normalizedPath);

        if (!fs.existsSync(fullPath)) {
            throw new Error('File not found');
        }

        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            throw new Error('Cannot read content of a directory');
        }

        return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
        console.error('Error getting file content:', error);
        throw new Error('Failed to get file content');
    }
};

export const getFileInfo = async (path: string): Promise<IFile | null> => {
    try {
        const normalizedPath = normalizePath(path);

        // Try MongoDB first if connected
        if (mongoose.connection.readyState === 1) {
            try {
                const file = await FileModel.findOne({ path: normalizedPath });
                if (file) {
                    return file;
                }
            } catch (mongoError) {
                console.log('MongoDB not available, using file system directly');
            }
        }

        // Fallback to file system
        const dataDir = process.env.DATA_DIR || '/data';
        const fullPath = normalizedPath === '/' ? dataDir : pathModule.join(dataDir, normalizedPath);

        if (!fs.existsSync(fullPath)) {
            return null;
        }

        const stats = fs.statSync(fullPath);
        const relativePath = normalizedPath === '/' ? '/' : normalizedPath;

        return {
            name: pathModule.basename(fullPath),
            path: relativePath,
            isFolder: stats.isDirectory(),
            size: stats.size,
            mimeType: stats.isDirectory() ? 'directory' : 'text/plain',
            content: stats.isDirectory() ? '' : fs.readFileSync(fullPath, 'utf8'),
            parentPath: getParentPath(normalizedPath),
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
            metadata: {
                description: `Test ${stats.isDirectory() ? 'directory' : 'file'}: ${pathModule.basename(fullPath)}`,
                tags: [stats.isDirectory() ? 'directory' : 'file'],
                author: 'Test System',
                version: '1.0.0'
            }
        } as any;
    } catch (error) {
        console.error('Error getting file info:', error);
        throw new Error('Failed to get file information');
    }
};

export const searchFiles = async (query: string, limit: number = 50): Promise<IFile[]> => {
    try {
        // Try MongoDB first if connected
        if (mongoose.connection.readyState === 1) {
            try {
                const results = await FileModel.find(
                    { $text: { $search: query } },
                    { score: { $meta: 'textScore' } }
                ).sort({ score: { $meta: 'textScore' } }).limit(limit);
                if (results && results.length > 0) {
                    return results;
                }
            } catch (mongoError) {
                console.log('MongoDB not available, using file system search');
            }
        }

        // Fallback to file system search
        return searchFilesInFileSystem(query, limit);
    } catch (error) {
        console.error('Error searching files:', error);
        throw new Error('Failed to search files');
    }
};

export const createFile = async (fileData: Partial<IFile>): Promise<IFile> => {
    try {
        const file = new FileModel(fileData);
        await file.save();
        return file;
    } catch (error) {
        console.error('Error creating file:', error);
        throw new Error('Failed to create file');
    }
};

export const updateFile = async (path: string, updateData: Partial<IFile>): Promise<IFile | null> => {
    try {
        const normalizedPath = normalizePath(path);
        const file = await FileModel.findOneAndUpdate(
            { path: normalizedPath },
            updateData,
            { new: true }
        );
        return file;
    } catch (error) {
        console.error('Error updating file:', error);
        throw new Error('Failed to update file');
    }
};

export const deleteFile = async (path: string): Promise<boolean> => {
    try {
        const normalizedPath = normalizePath(path);
        const result = await FileModel.deleteOne({ path: normalizedPath });
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw new Error('Failed to delete file');
    }
};

export const createDirectory = async (path: string): Promise<IFile> => {
    try {
        const normalizedPath = normalizePath(path);
        const parentPath = getParentPath(normalizedPath);

        const directory = new FileModel({
            name: pathModule.basename(normalizedPath),
            path: normalizedPath,
            isFolder: true,
            size: 0,
            parentPath: parentPath
        });

        await directory.save();
        return directory;
    } catch (error) {
        console.error('Error creating directory:', error);
        throw new Error('Failed to create directory');
    }
};

export const getDownloadStream = async (path: string): Promise<Readable> => {
    try {
        const normalizedPath = normalizePath(path);
        const file = await FileModel.findOne({ path: normalizedPath });

        if (!file) {
            throw new Error('File not found');
        }

        if (file.isFolder) {
            return await createZipArchive(normalizedPath);
        } else {
            const content = file.content || '';
            return Readable.from([content]);
        }
    } catch (error) {
        console.error('Error getting download stream:', error);
        throw new Error('Failed to get download stream');
    }
};

export const pathExists = async (path: string): Promise<boolean> => {
    try {
        const normalizedPath = normalizePath(path);
        const file = await FileModel.findOne({ path: normalizedPath });
        return !!file;
    } catch (error) {
        console.error('Error checking path existence:', error);
        return false;
    }
};

export const getFileStats = async (path: string): Promise<{
    totalFiles: number;
    totalSize: number;
    totalDirectories: number;
}> => {
    try {
        const normalizedPath = normalizePath(path);

        // Try MongoDB first if connected
        if (mongoose.connection.readyState === 1) {
            try {
                const contents = await FileModel.find({ parentPath: normalizedPath });

                let totalFiles = 0;
                let totalSize = 0;
                let totalDirectories = 0;

                for (const item of contents) {
                    if (item.isFolder) {
                        totalDirectories++;
                    } else {
                        totalFiles++;
                        totalSize += item.size;
                    }
                }

                return { totalFiles, totalSize, totalDirectories };
            } catch (mongoError) {
                console.log('MongoDB not available, using file system stats');
            }
        }

        // Fallback to file system
        const contents = await getDirectoryContentsFromFileSystem(normalizedPath);

        let totalFiles = 0;
        let totalSize = 0;
        let totalDirectories = 0;

        for (const item of contents) {
            if (item.isFolder) {
                totalDirectories++;
            } else {
                totalFiles++;
                totalSize += item.size;
            }
        }

        return { totalFiles, totalSize, totalDirectories };
    } catch (error) {
        console.error('Error getting file stats:', error);
        throw new Error('Failed to get file statistics');
    }
};

// Legacy class export for backward compatibility
export class FileService {
    static getDirectoryContents = getDirectoryContents;
    static getFileContent = getFileContent;
    static getFileInfo = getFileInfo;
    static searchFiles = searchFiles;
    static createFile = createFile;
    static updateFile = updateFile;
    static deleteFile = deleteFile;
    static createDirectory = createDirectory;
    static getDownloadStream = getDownloadStream;
    static pathExists = pathExists;
    static getFileStats = getFileStats;
}