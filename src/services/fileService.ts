import { FileModel, IFile } from '../models/fileModel';
import { join, dirname, basename } from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

export class FileService {
    static async getDirectoryContents(path: string): Promise<IFile[]> {
        try {
            const normalizedPath = this.normalizePath(path);

            // Try MongoDB first
            try {
                const contents = await FileModel.getDirectoryContents(normalizedPath);
                if (contents && contents.length > 0) {
                    return contents;
                }
            } catch (mongoError) {
                console.log('MongoDB not available, using file system directly');
            }

            // Fallback to file system
            return this.getDirectoryContentsFromFileSystem(normalizedPath);
        } catch (error) {
            console.error('Error getting directory contents:', error);
            throw new Error('Failed to get directory contents');
        }
    }

    static async getFileContent(path: string): Promise<string> {
        try {
            const normalizedPath = this.normalizePath(path);

            // Try MongoDB first
            try {
                const file = await FileModel.findByPath(normalizedPath);
                if (file && !file.isFolder) {
                    return file.content || '';
                }
            } catch (mongoError) {
                console.log('MongoDB not available, using file system directly');
            }

            // Fallback to file system
            const dataDir = process.env.DATA_DIR || '/data';
            const fullPath = path === '/' ? dataDir : path.join(dataDir, normalizedPath);

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
    }

    static async getFileInfo(path: string): Promise<IFile | null> {
        try {
            const normalizedPath = this.normalizePath(path);
            const file = await FileModel.findByPath(normalizedPath);
            return file;
        } catch (error) {
            console.error('Error getting file info:', error);
            throw new Error('Failed to get file information');
        }
    }

    static async searchFiles(query: string, limit: number = 50): Promise<IFile[]> {
        try {
            const results = await FileModel.searchFiles(query, limit);
            return results;
        } catch (error) {
            console.error('Error searching files:', error);
            throw new Error('Failed to search files');
        }
    }

    static async createFile(fileData: Partial<IFile>): Promise<IFile> {
        try {
            const file = new FileModel(fileData);
            await file.save();
            return file;
        } catch (error) {
            console.error('Error creating file:', error);
            throw new Error('Failed to create file');
        }
    }

    static async updateFile(path: string, updateData: Partial<IFile>): Promise<IFile | null> {
        try {
            const normalizedPath = this.normalizePath(path);
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
    }

    static async deleteFile(path: string): Promise<boolean> {
        try {
            const normalizedPath = this.normalizePath(path);
            const result = await FileModel.deleteOne({ path: normalizedPath });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file');
        }
    }

    static async createDirectory(path: string): Promise<IFile> {
        try {
            const normalizedPath = this.normalizePath(path);
            const parentPath = this.getParentPath(normalizedPath);

            const directory = new FileModel({
                name: basename(normalizedPath),
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
    }

    static async getDownloadStream(path: string): Promise<Readable> {
        try {
            const normalizedPath = this.normalizePath(path);
            const file = await FileModel.findByPath(normalizedPath);

            if (!file) {
                throw new Error('File not found');
            }

            if (file.isFolder) {
                return await this.createZipArchive(normalizedPath);
            } else {
                const content = file.content || '';
                return Readable.from([content]);
            }
        } catch (error) {
            console.error('Error getting download stream:', error);
            throw new Error('Failed to get download stream');
        }
    }

    private static async createZipArchive(path: string): Promise<Readable> {
        return new Promise((resolve, reject) => {
            const archive = archiver('zip', { zlib: { level: 9 } });
            const stream = new Readable();

            archive.on('error', (err) => {
                reject(err);
            });

            archive.on('end', () => {
                stream.push(null);
            });

            this.addDirectoryToArchive(archive, path, path);

            archive.finalize();
            archive.pipe(stream);
            resolve(stream);
        });
    }

    private static async addDirectoryToArchive(archive: archiver.Archiver, dirPath: string, rootPath: string): Promise<void> {
        try {
            const contents = await FileModel.find({ parentPath: dirPath });

            for (const item of contents) {
                if (item.isFolder) {
                    await this.addDirectoryToArchive(archive, item.path, rootPath);
                } else {
                    const relativePath = item.path.replace(rootPath, '').substring(1);
                    archive.append(item.content || '', { name: relativePath });
                }
            }
        } catch (error) {
            console.error('Error adding directory to archive:', error);
        }
    }

    private static normalizePath(path: string): string {
        if (!path || path === '/') return '/';
        return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    }

    private static getParentPath(path: string): string {
        if (path === '/') return '';
        const parts = path.split('/');
        parts.pop();
        return parts.join('/') || '/';
    }

    static async pathExists(path: string): Promise<boolean> {
        try {
            const normalizedPath = this.normalizePath(path);
            return await FileModel.pathExists(normalizedPath);
        } catch (error) {
            console.error('Error checking path existence:', error);
            return false;
        }
    }

    static async getFileStats(path: string): Promise<{
        totalFiles: number;
        totalSize: number;
        totalDirectories: number;
    }> {
        try {
            const normalizedPath = this.normalizePath(path);
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
        } catch (error) {
            console.error('Error getting file stats:', error);
            throw new Error('Failed to get file statistics');
        }
    }

    private static async getDirectoryContentsFromFileSystem(path: string): Promise<IFile[]> {
        const dataDir = process.env.DATA_DIR || '/data';
        const fullPath = path === '/' ? dataDir : path.join(dataDir, path);

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
                const itemPath = path.join(fullPath, item);
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
                    metadata: {
                        description: `Test ${itemStats.isDirectory() ? 'directory' : 'file'}: ${item}`,
                        tags: [itemStats.isDirectory() ? 'directory' : 'file'],
                        author: 'Test System',
                        version: '1.0.0'
                    }
                });
            }

            return contents;
        } catch (error) {
            console.error('Error reading file system:', error);
            return [];
        }
    }
}