import { Router } from 'express';
import { listDirectory, getFileContentHandler, downloadItem, getFileInfoHandler } from '../controllers/fileController';
import { searchFiles, getFileStats } from '../services/fileService';

const router = Router();

router.get('/list', listDirectory);
router.get('/file', getFileContentHandler);
router.get('/download', downloadItem);
router.get('/info', getFileInfoHandler);

router.get('/search', async (req, res) => {
    try {
        const { q: query, limit = '50' } = req.query;

        if (typeof query !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Invalid search query'
            });
            return;
        }

        const results = await searchFiles(query, parseInt(limit as string));

        res.json({
            success: true,
            data: {
                results: results.map(item => ({
                    name: item.name,
                    path: item.path,
                    isFolder: item.isFolder,
                    size: item.size,
                    mimeType: item.mimeType,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                })),
                query,
                total: results.length
            }
        });
    } catch (error) {
        console.error('Error searching files:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search files',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const { path: dirPath = '' } = req.query;

        if (typeof dirPath !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Invalid path parameter'
            });
            return;
        }

        const stats = await getFileStats(dirPath);

        res.json({
            success: true,
            data: {
                path: dirPath,
                ...stats
            }
        });
    } catch (error) {
        console.error('Error getting file stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get file statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
