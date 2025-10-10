import { Router } from 'express';
import { FileController } from '../controllers/fileController';
import { FileService } from '../services/fileService';

const router = Router();
const fileController = new FileController();

// GET /api/list?path=<directory_path> - List directory contents
router.get('/list', fileController.listDirectory);

// GET /api/file?path=<file_path> - Get file content
router.get('/file', fileController.getFileContent);

// GET /api/download?path=<item_path> - Download file or folder (as zip)
router.get('/download', fileController.downloadItem);

// GET /api/info?path=<file_path> - Get file information
router.get('/info', fileController.getFileInfo);

// GET /api/search?q=<query> - Search files
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

        const results = await FileService.searchFiles(query, parseInt(limit as string));

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

// GET /api/stats?path=<directory_path> - Get directory statistics
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

        const stats = await FileService.getFileStats(dirPath);

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
