import request from 'supertest';
import express from 'express';
import fileRoutes from '../../routes/fileRoutes';
import { createFabricatedFileSystem } from '../../config/fabrication';
import { TEST_DATA_DIR } from '../setup';

const app = express();
app.use(express.json());
app.use('/api', fileRoutes);

describe('File Routes', () => {
    beforeAll(async () => {
        await createFabricatedFileSystem(TEST_DATA_DIR);
    });

    describe('GET /api/list', () => {
        it('should list root directory contents', async () => {
            const response = await request(app)
                .get('/api/list')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('currentPath', '');
            expect(Array.isArray(response.body.data.items)).toBe(true);
        });

        it('should list specific directory contents', async () => {
            const response = await request(app)
                .get('/api/list?path=test_pipeline_results')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.currentPath).toBe('test_pipeline_results');
            expect(response.body.data.items.length).toBeGreaterThan(0);
        });

        it('should handle non-existent directory', async () => {
            const response = await request(app)
                .get('/api/list?path=non_existent_directory')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /api/file', () => {
        it('should return file content', async () => {
            const response = await request(app)
                .get('/api/file?path=test_pipeline_results/job_12345/integration_test.log')
                .expect(200);

            expect(response.text).toContain('Starting integration tests');
        });

        it('should handle non-existent file', async () => {
            const response = await request(app)
                .get('/api/file?path=non_existent_file.log')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('File not found');
        });

        it('should handle directory path as file', async () => {
            const response = await request(app)
                .get('/api/file?path=test_pipeline_results')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Path is not a file');
        });
    });

    describe('GET /api/download', () => {
        it('should download a file', async () => {
            const response = await request(app)
                .get('/api/download?path=test_pipeline_results/job_12345/integration_test.log')
                .expect(200);

            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.text).toContain('Starting integration tests');
        });

        it('should download a directory as zip', async () => {
            const response = await request(app)
                .get('/api/download?path=test_pipeline_results/job_12345')
                .expect(200);

            expect(response.headers['content-type']).toBe('application/zip');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('.zip');
        });

        it('should handle non-existent item', async () => {
            const response = await request(app)
                .get('/api/download?path=non_existent_item')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Item not found');
        });
    });

    describe('GET /api/info', () => {
        it('should return file information', async () => {
            const response = await request(app)
                .get('/api/info?path=test_pipeline_results/job_12345/integration_test.log')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name');
            expect(response.body.data).toHaveProperty('size');
            expect(response.body.data).toHaveProperty('isFile', true);
            expect(response.body.data).toHaveProperty('mimeType');
        });

        it('should handle non-existent file', async () => {
            const response = await request(app)
                .get('/api/info?path=non_existent_file.log')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('File not found');
        });
    });
});
