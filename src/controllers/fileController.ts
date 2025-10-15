import { Request, Response } from 'express';
import { getDirectoryContents, getFileContent, getFileInfo, getDownloadStream } from '../services/fileService';
import { ApiResponse, FileItem, DirectoryContents } from '../types/fileTypes';
import * as path from 'path';

export const listDirectory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { path: dirPath = '' } = req.query;

        if (typeof dirPath !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Invalid path parameter'
            });
            return;
        }

        const items = await getDirectoryContents(dirPath);
        const parentPath = dirPath === '/' ? undefined : path.dirname(dirPath) || '/';

        const response: ApiResponse<DirectoryContents> = {
            success: true,
            data: {
                items: items.map(item => ({
                    name: item.name,
                    path: item.path,
                    isFolder: item.isFolder,
                    size: item.size,
                    mimeType: item.mimeType,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                })),
                currentPath: dirPath,
                parentPath: parentPath
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error listing directory:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list directory',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getFileContentHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { path: filePath } = req.query;

        if (typeof filePath !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Invalid path parameter'
            });
            return;
        }

        const file = await getFileInfo(filePath);
        if (!file) {
            res.status(404).json({
                success: false,
                error: 'File not found'
            });
            return;
        }

        if (file.isFolder) {
            res.status(400).json({
                success: false,
                error: 'Path is not a file'
            });
            return;
        }

        const content = await getFileContent(filePath);

        res.set({
            'Content-Type': file.mimeType || 'text/plain',
            'Content-Length': content.length.toString(),
            'Last-Modified': file.updatedAt.toUTCString()
        });

        res.send(content);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read file',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const downloadItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { path: itemPath } = req.query;

        if (typeof itemPath !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Invalid path parameter'
            });
            return;
        }

        const file = await getFileInfo(itemPath);
        if (!file) {
            res.status(404).json({
                success: false,
                error: 'Item not found'
            });
            return;
        }

        if (file.isFolder) {
            const stream = await getDownloadStream(itemPath);
            const zipFileName = `${path.basename(itemPath)}.zip`;

            res.set({
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${zipFileName}"`
            });

            stream.pipe(res);
        } else {
            const content = await getFileContent(itemPath);
            const fileName = path.basename(itemPath);

            res.set({
                'Content-Type': file.mimeType || 'text/plain',
                'Content-Length': content.length.toString(),
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Last-Modified': file.updatedAt.toUTCString()
            });

            res.send(content);
        }
    } catch (error) {
        console.error('Error downloading item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download item',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getFileInfoHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { path: filePath } = req.query;

        if (typeof filePath !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Invalid path parameter'
            });
            return;
        }

        const file = await getFileInfo(filePath);
        if (!file) {
            res.status(404).json({
                success: false,
                error: 'File not found'
            });
            return;
        }

        const fileInfo = {
            name: file.name,
            path: file.path,
            size: file.size,
            isDirectory: file.isFolder,
            isFile: !file.isFolder,
            mimeType: file.mimeType,
            isTextFile: file.mimeType?.startsWith('text/') || false,
            lastModified: file.updatedAt.toISOString(),
            created: file.createdAt.toISOString(),
            metadata: file.metadata
        };

        const response: ApiResponse<typeof fileInfo> = {
            success: true,
            data: fileInfo
        };

        res.json(response);
    } catch (error) {
        console.error('Error getting file info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get file info',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};