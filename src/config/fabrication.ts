import * as fs from 'fs';
import * as path from 'path';
import { migrateFileSystemToMongoDB, verifyMigration, getMigrationStats } from '../services/dataMigrationService';
import { generateTestData } from './dummyDataGenerator';
import { logger } from '../utils/logger';

const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const generateDynamicLogContent = (testType: string, jobId: string): string => {
  const timestamp = new Date().toISOString();
  const statuses = ['PASS', 'FAIL', 'SKIP', 'WARN'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return `[${timestamp}] Starting ${testType} test for job ${jobId}
[${timestamp}] Test environment initialized
[${timestamp}] Running test suite: ${testType}_suite_${Math.floor(Math.random() * 1000)}
[${timestamp}] Test case 1: ${randomStatus}
[${timestamp}] Test case 2: ${randomStatus}
[${timestamp}] Test case 3: ${randomStatus}
[${timestamp}] Test execution completed
[${timestamp}] Results: ${Math.floor(Math.random() * 100)}% pass rate
[${timestamp}] Duration: ${Math.floor(Math.random() * 300)}s
[${timestamp}] Memory usage: ${Math.floor(Math.random() * 1000)}MB
[${timestamp}] Test ${testType} completed with status: ${randomStatus}`;
};

const generateDynamicReport = (jobId: string, testType: string): string => {
  const timestamp = new Date().toISOString();
  const passRate = Math.floor(Math.random() * 100);
  const totalTests = Math.floor(Math.random() * 100) + 10;
  const passedTests = Math.floor((totalTests * passRate) / 100);

  return `<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${jobId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #e8f4fd; padding: 15px; border-radius: 5px; }
        .pass { color: green; }
        .fail { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report - ${jobId}</h1>
        <p>Generated: ${timestamp}</p>
        <p>Test Type: ${testType}</p>
    </div>
    <div class="stats">
        <div class="stat">
            <h3>Total Tests</h3>
            <p>${totalTests}</p>
        </div>
        <div class="stat">
            <h3>Passed</h3>
            <p class="pass">${passedTests}</p>
        </div>
        <div class="stat">
            <h3>Failed</h3>
            <p class="fail">${totalTests - passedTests}</p>
        </div>
        <div class="stat">
            <h3>Pass Rate</h3>
            <p>${passRate}%</p>
        </div>
    </div>
    <div class="content">
        <h2>Test Details</h2>
        <p>This is a dynamically generated test report for job ${jobId}.</p>
        <p>The test type was ${testType} and completed at ${timestamp}.</p>
    </div>
</body>
</html>`;
};

const generateLogEntry = (): string => {
  const timestamp = new Date().toISOString();
  const messages = [
    'Additional test case executed',
    'Performance metrics updated',
    'Memory usage optimized',
    'Test environment refreshed',
    'New test data loaded',
    'Validation completed',
    'Cleanup process finished'
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  return `[${timestamp}] ${randomMessage}`;
};

const generateNewTestResult = async (dataDir: string): Promise<void> => {
  const testResultsDir = path.join(dataDir, 'test_pipeline_results');
  const jobId = `job_${Date.now()}`;
  const jobDir = path.join(testResultsDir, jobId);

  await ensureDirectoryExists(jobDir);

  const testTypes = ['integration', 'unit', 'performance', 'e2e', 'smoke', 'regression'];
  const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];

  const logContent = generateDynamicLogContent(randomType, jobId);
  const logPath = path.join(jobDir, `${randomType}_test.log`);
  await fs.promises.writeFile(logPath, logContent);

  const reportContent = generateDynamicReport(jobId, randomType);
  const reportPath = path.join(jobDir, 'test_report.html');
  await fs.promises.writeFile(reportPath, reportContent);

  if (!process.env.FABRICATOR_QUIET) logger.info(`Generated new test result: ${jobId}`);
};

const updateJobFiles = async (jobPath: string): Promise<void> => {
  try {
    const files = await fs.promises.readdir(jobPath);

    for (const file of files) {
      if (file.endsWith('.log')) {
        const filePath = path.join(jobPath, file);
        const existingContent = await fs.promises.readFile(filePath, 'utf-8');
        const newEntry = generateLogEntry();
        const updatedContent = existingContent + '\n' + newEntry;
        await fs.promises.writeFile(filePath, updatedContent);
        if (!process.env.FABRICATOR_QUIET) logger.debug(`Appended new entry to ${filePath}`);
      }
    }
  } catch (error) {
    logger.error('Error updating job files:', error);
  }
};

const updateExistingFiles = async (dataDir: string): Promise<void> => {
  const testResultsDir = path.join(dataDir, 'test_pipeline_results');

  try {
    const jobDirs = await fs.promises.readdir(testResultsDir, { withFileTypes: true });

    for (const jobDir of jobDirs) {
      if (jobDir.isDirectory()) {
        const jobPath = path.join(testResultsDir, jobDir.name);
        await updateJobFiles(jobPath);
      }
    }
  } catch (error) {
    console.error('Error updating existing files:', error);
  }
};

const startDynamicDataGeneration = (dataDir: string): void => {
  setInterval(async () => {
    try {
      if (!process.env.FABRICATOR_QUIET) logger.info('Generating new test result...');
      await generateNewTestResult(dataDir);
      if (!process.env.FABRICATOR_QUIET) logger.info('New test result generated successfully');
    } catch (error) {
      logger.error('Error generating new test result:', error);
    }
  }, 300000);

  setInterval(async () => {
    try {
      if (!process.env.FABRICATOR_QUIET) logger.info('Updating existing files...');
      await updateExistingFiles(dataDir);
      if (!process.env.FABRICATOR_QUIET) logger.info('Files updated successfully');
    } catch (error) {
      logger.error('Error updating existing files:', error);
    }
  }, 600000);

  if (!process.env.FABRICATOR_QUIET) logger.info('Dynamic data generation started');
};

export const createFabricatedFileSystem = async (dataDir: string = '/data'): Promise<void> => {
  try {
    await ensureDirectoryExists(dataDir);

    if (!process.env.FABRICATOR_QUIET) logger.info('Generating comprehensive test data...');
    await generateTestData(dataDir);

    try {
      if (!process.env.FABRICATOR_QUIET) logger.info('Migrating file system data to MongoDB...');
      await migrateFileSystemToMongoDB(dataDir);

      const isVerified = await verifyMigration();
      if (isVerified) {
        const stats = await getMigrationStats();
        logger.info(`Migration completed: ${stats.totalFiles} files, ${stats.totalDirectories} directories, ${stats.totalSize} bytes`);
      } else {
        logger.warn('MongoDB migration failed, but file system data is available');
      }
    } catch (mongoError: unknown) {
      const msg = mongoError instanceof Error ? mongoError.message : String(mongoError);
      logger.warn(`MongoDB migration failed, using file system directly: ${msg}`);
    }

    if (!process.env.FABRICATOR_QUIET) logger.info('Fabricated file system created successfully');
  } catch (error) {
    logger.error('Error creating fabricated file system:', error);
    throw error;
  }
};

export const startDynamicGeneration = (dataDir: string = '/data'): void => {
  startDynamicDataGeneration(dataDir);
};