import * as fs from 'fs';
import * as path from 'path';

// Utility functions
const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const generateTestLog = (testType: string, status: string): string => {
    const timestamp = new Date().toISOString();
    const logLevel = status === 'failed' ? 'ERROR' : 'INFO';

    return `[${timestamp}] ${logLevel} Starting ${testType} test execution
[${timestamp}] INFO Test environment: staging
[${timestamp}] INFO Test configuration loaded successfully
[${timestamp}] INFO Database connection established
[${timestamp}] INFO Test data prepared
[${timestamp}] INFO Executing test cases...
[${timestamp}] INFO Test case 1: Login functionality - ${status.toUpperCase()}
[${timestamp}] INFO Test case 2: User registration - ${status.toUpperCase()}
[${timestamp}] INFO Test case 3: Data validation - ${status.toUpperCase()}
[${timestamp}] INFO Test case 4: API endpoints - ${status.toUpperCase()}
[${timestamp}] INFO Test case 5: Database operations - ${status.toUpperCase()}
[${timestamp}] ${logLevel} Test execution completed with status: ${status.toUpperCase()}
[${timestamp}] INFO Total execution time: ${Math.floor(Math.random() * 300) + 60} seconds
[${timestamp}] INFO Memory usage: ${Math.floor(Math.random() * 500) + 100}MB
[${timestamp}] INFO Test artifacts saved to: /tmp/test_artifacts`;
};

const generateErrorLog = (status: string): string => {
    if (status === 'passed') {
        return `[${new Date().toISOString()}] INFO No errors detected during test execution
[${new Date().toISOString()}] INFO All test cases completed successfully`;
    }

    const timestamp = new Date().toISOString();
    return `[${timestamp}] ERROR Test case failed: Login functionality
[${timestamp}] ERROR Assertion failed: Expected "Welcome" but got "Error"
[${timestamp}] ERROR Stack trace: 
    at LoginTest.verifyWelcomeMessage (LoginTest.js:45:12)
    at Object.runTest (TestRunner.js:23:8)
    at TestSuite.execute (TestSuite.js:67:15)
[${timestamp}] ERROR Database connection timeout after 30 seconds
[${timestamp}] ERROR API endpoint returned 500 status code
[${timestamp}] ERROR Memory allocation failed: Cannot allocate 1GB`;
};

const generateDebugLog = (testType: string): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] DEBUG Initializing ${testType} test environment
[${timestamp}] DEBUG Loading test configuration from config.json
[${timestamp}] DEBUG Setting up test database with sample data
[${timestamp}] DEBUG Configuring test browser: Chrome 120.0
[${timestamp}] DEBUG Setting test timeout to 30000ms
[${timestamp}] DEBUG Enabling verbose logging for ${testType} tests
[${timestamp}] DEBUG Test data cleanup completed
[${timestamp}] DEBUG Browser console logs captured
[${timestamp}] DEBUG Network requests intercepted and logged
[${timestamp}] DEBUG Screenshots saved to /tmp/screenshots`;
};

const generateTestReport = (jobId: string, testType: string, status: string): string => {
    const passRate = status === 'passed' ? '100%' : '60%';
    const totalTests = 25;
    const passedTests = status === 'passed' ? 25 : 15;
    const failedTests = totalTests - passedTests;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${jobId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .status { font-size: 24px; font-weight: bold; color: ${status === 'passed' ? 'green' : 'red'}; }
        .summary { margin: 20px 0; }
        .test-results { margin: 20px 0; }
        .passed { color: green; }
        .failed { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report - ${jobId}</h1>
        <div class="status">Status: ${status.toUpperCase()}</div>
        <p>Test Type: ${testType}</p>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${totalTests}</p>
        <p class="passed">Passed: ${passedTests}</p>
        <p class="failed">Failed: ${failedTests}</p>
        <p>Pass Rate: ${passRate}</p>
    </div>
    
    <div class="test-results">
        <h2>Test Results</h2>
        <ul>
            <li class="passed">✓ Login functionality test</li>
            <li class="passed">✓ User registration test</li>
            <li class="passed">✓ Data validation test</li>
            ${status === 'failed' ? '<li class="failed">✗ API endpoint test</li>' : '<li class="passed">✓ API endpoint test</li>'}
            <li class="passed">✓ Database operations test</li>
        </ul>
    </div>
</body>
</html>`;
};

const generateTestResultsJson = (jobId: string, testType: string, status: string): any => {
    return {
        jobId,
        testType,
        status,
        timestamp: new Date().toISOString(),
        summary: {
            total: 25,
            passed: status === 'passed' ? 25 : 15,
            failed: status === 'passed' ? 0 : 10,
            skipped: 0,
            duration: Math.floor(Math.random() * 300) + 60
        },
        tests: [
            { name: 'Login functionality', status: 'passed', duration: 5.2 },
            { name: 'User registration', status: 'passed', duration: 3.8 },
            { name: 'Data validation', status: 'passed', duration: 2.1 },
            { name: 'API endpoints', status: status === 'passed' ? 'passed' : 'failed', duration: 8.5 },
            { name: 'Database operations', status: 'passed', duration: 4.3 }
        ],
        environment: {
            browser: 'Chrome 120.0',
            os: 'Windows 11',
            nodeVersion: '18.17.0',
            testFramework: 'Jest 29.0'
        }
    };
};

const generateCoverageReport = (testType: string): string => {
    const coverage = Math.floor(Math.random() * 30) + 70;
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Report - ${testType}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .coverage { font-size: 48px; font-weight: bold; color: ${coverage >= 80 ? 'green' : coverage >= 60 ? 'orange' : 'red'}; }
        .summary { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Code Coverage Report</h1>
    <div class="coverage">${coverage}%</div>
    <div class="summary">
        <p>Lines: ${coverage}% (${Math.floor(Math.random() * 1000) + 500}/${Math.floor(Math.random() * 200) + 800})</p>
        <p>Functions: ${coverage + 5}% (${Math.floor(Math.random() * 50) + 20}/${Math.floor(Math.random() * 10) + 30})</p>
        <p>Branches: ${coverage - 5}% (${Math.floor(Math.random() * 200) + 100}/${Math.floor(Math.random() * 50) + 150})</p>
    </div>
</body>
</html>`;
};

const generatePerformanceData = (): any => {
    return {
        timestamp: new Date().toISOString(),
        metrics: {
            responseTime: Math.floor(Math.random() * 1000) + 100,
            throughput: Math.floor(Math.random() * 1000) + 500,
            memoryUsage: Math.floor(Math.random() * 500) + 100,
            cpuUsage: Math.floor(Math.random() * 80) + 10
        },
        benchmarks: {
            pageLoad: Math.floor(Math.random() * 2000) + 500,
            domReady: Math.floor(Math.random() * 1000) + 200,
            firstPaint: Math.floor(Math.random() * 500) + 100
        }
    };
};

const generateMetricsCsv = (testType: string): string => {
    return `timestamp,test_type,metric_name,value,unit
${new Date().toISOString()},${testType},response_time,${Math.floor(Math.random() * 1000) + 100},ms
${new Date().toISOString()},${testType},memory_usage,${Math.floor(Math.random() * 500) + 100},MB
${new Date().toISOString()},${testType},cpu_usage,${Math.floor(Math.random() * 80) + 10},%
${new Date().toISOString()},${testType},error_rate,${Math.floor(Math.random() * 5)},%
${new Date().toISOString()},${testType},success_rate,${Math.floor(Math.random() * 20) + 80},%`;
};

const generateCategorySummary = (categoryName: string): string => {
    return `# ${categoryName.replace('_', ' ').toUpperCase()} SUMMARY

## Overview
This directory contains ${categoryName.replace('_', ' ')} results and artifacts.

## Files
- summary.txt: This summary file
- README.md: Detailed documentation
- config.json: Test configuration

## Test Results
- Total test suites: ${Math.floor(Math.random() * 20) + 10}
- Total test cases: ${Math.floor(Math.random() * 100) + 50}
- Pass rate: ${Math.floor(Math.random() * 30) + 70}%
- Average execution time: ${Math.floor(Math.random() * 60) + 30} seconds

## Last Updated
${new Date().toISOString()}`;
};

const generateCategoryReadme = (categoryName: string): string => {
    return `# ${categoryName.replace('_', ' ').toUpperCase()} Documentation

## Description
This directory contains all ${categoryName.replace('_', ' ')} related files and results.

## Structure
\`\`\`
${categoryName}/
├── summary.txt          # Test summary
├── README.md            # This documentation
├── config.json         # Test configuration
└── results/            # Individual test results
\`\`\`

## Usage
1. Review the summary.txt for quick overview
2. Check individual test results in the results/ directory
3. Use config.json to understand test configuration

## Test Types
- Unit tests: Individual component testing
- Integration tests: Component interaction testing
- End-to-end tests: Full workflow testing
- Performance tests: Load and stress testing

## Contact
For questions about these tests, contact the QA team.`;
};

const generateCategoryConfig = (categoryName: string): any => {
    return {
        category: categoryName,
        testFramework: "Jest",
        timeout: 30000,
        retries: 3,
        parallel: true,
        coverage: {
            enabled: true,
            threshold: 80
        },
        environment: {
            node: "18.17.0",
            browser: "Chrome 120.0"
        },
        lastUpdated: new Date().toISOString()
    };
};

const generateTestSuite = (suiteName: string, categoryName: string): any => {
    return {
        suiteName,
        category: categoryName,
        timestamp: new Date().toISOString(),
        tests: [
            { name: 'Test 1', status: 'passed', duration: 1.2 },
            { name: 'Test 2', status: 'passed', duration: 0.8 },
            { name: 'Test 3', status: 'failed', duration: 2.1 }
        ],
        summary: {
            total: 3,
            passed: 2,
            failed: 1,
            duration: 4.1
        }
    };
};

const generateCoverageSummary = (categoryName: string): string => {
    const coverage = Math.floor(Math.random() * 30) + 70;
    return `<!DOCTYPE html>
<html>
<head><title>Coverage Summary - ${categoryName}</title></head>
<body>
    <h1>Code Coverage Summary</h1>
    <div style="font-size: 48px; color: ${coverage >= 80 ? 'green' : 'orange'};">
        ${coverage}%
    </div>
    <p>Category: ${categoryName}</p>
    <p>Generated: ${new Date().toISOString()}</p>
</body>
</html>`;
};

// Main service functions
const createTestJob = async (jobId: string, testType: string, status: string, baseDir: string): Promise<void> => {
    const jobDir = path.join(baseDir, jobId);
    await ensureDirectoryExists(jobDir);

    // Create essential test log files (reduced for demo)
    const logFiles = [
        { name: `${testType}_test.log`, content: generateTestLog(testType, status) },
        { name: 'error.log', content: generateErrorLog(status) },
        { name: 'debug.log', content: generateDebugLog(testType) }
    ];

    for (const logFile of logFiles) {
        const filePath = path.join(jobDir, logFile.name);
        fs.writeFileSync(filePath, logFile.content);
    }

    // Create test report HTML
    const reportPath = path.join(jobDir, 'test_report.html');
    const reportContent = generateTestReport(jobId, testType, status);
    fs.writeFileSync(reportPath, reportContent);

    // Create JSON results
    const jsonPath = path.join(jobDir, 'test_results.json');
    const jsonContent = generateTestResultsJson(jobId, testType, status);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));

    // Create coverage report
    const coveragePath = path.join(jobDir, 'coverage_report.html');
    const coverageContent = generateCoverageReport(testType);
    fs.writeFileSync(coveragePath, coverageContent);

    // Create essential additional files (reduced for demo)
    const additionalFiles = [
        { name: 'performance.json', content: JSON.stringify(generatePerformanceData(), null, 2) },
        { name: 'metrics.csv', content: generateMetricsCsv(testType) }
    ];

    for (const file of additionalFiles) {
        const filePath = path.join(jobDir, file.name);
        fs.writeFileSync(filePath, file.content);
    }

    console.log(`Created test job: ${jobId} (${testType}) - ${status}`);
};

const createTestCategory = async (categoryName: string, baseDir: string): Promise<void> => {
    const categoryDir = path.join(baseDir, categoryName);
    await ensureDirectoryExists(categoryDir);

    // Create essential summary files for each category (reduced for demo)
    const summaryFiles = [
        { name: 'summary.txt', content: generateCategorySummary(categoryName) },
        { name: 'README.md', content: generateCategoryReadme(categoryName) },
        { name: 'config.json', content: generateCategoryConfig(categoryName) }
    ];

    for (const file of summaryFiles) {
        const filePath = path.join(categoryDir, file.name);
        const content = typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2);
        fs.writeFileSync(filePath, content);
    }

    // Create a results subdirectory with essential test files (reduced for demo)
    const resultsDir = path.join(categoryDir, 'results');
    await ensureDirectoryExists(resultsDir);

    const resultFiles = [
        { name: 'test_suite_1.json', content: JSON.stringify(generateTestSuite('suite_1', categoryName), null, 2) },
        { name: 'coverage_summary.html', content: generateCoverageSummary(categoryName) }
    ];

    for (const file of resultFiles) {
        const filePath = path.join(resultsDir, file.name);
        fs.writeFileSync(filePath, file.content);
    }

    console.log(`Created test category: ${categoryName}`);
};

export const generateTestData = async (dataDir: string = '/data'): Promise<void> => {
    try {
        console.log('Generating comprehensive test data...');

        // Create main test pipeline results directory
        const testResultsDir = path.join(dataDir, 'test_pipeline_results');
        await ensureDirectoryExists(testResultsDir);

        // Generate 25 test job directories for demo purposes
        const testJobs = [];
        const testTypes = ['integration', 'unit', 'e2e', 'performance', 'smoke', 'regression', 'security', 'load', 'api', 'ui'];
        const statuses = ['passed', 'failed', 'passed', 'passed', 'failed', 'passed', 'passed', 'failed', 'passed', 'passed'];

        for (let i = 1; i <= 25; i++) {
            const jobId = `job_${i.toString().padStart(3, '0')}`;
            const testType = testTypes[i % testTypes.length];
            const status = statuses[i % statuses.length];
            testJobs.push({ id: jobId, type: testType, status });
        }

        for (const job of testJobs) {
            await createTestJob(job.id, job.type, job.status, testResultsDir);
        }

        // Create additional directories for different test categories (reduced for demo)
        await createTestCategory('unit_tests', testResultsDir);
        await createTestCategory('integration_tests', testResultsDir);
        await createTestCategory('e2e_tests', testResultsDir);

        console.log('✅ Test data generation completed successfully');
    } catch (error) {
        console.error('❌ Error generating test data:', error);
        throw error;
    }
};

// Legacy class export for backward compatibility
export class DummyDataGenerator {
    private dataDir: string;

    constructor(dataDir: string = '/data') {
        this.dataDir = dataDir;
    }

    public async generateTestData(): Promise<void> {
        return generateTestData(this.dataDir);
    }
}