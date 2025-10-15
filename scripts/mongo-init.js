// MongoDB initialization script for Test Report Dashboard
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('test-report-dashboard');

// Create a user for the application
db.createUser({
    user: 'app_user',
    pwd: 'app_password',
    roles: [
        {
            role: 'readWrite',
            db: 'test-report-dashboard'
        }
    ]
});

// Create indexes for better performance
db.files.createIndex({ "path": 1 }, { unique: true });
db.files.createIndex({ "parentPath": 1 });
db.files.createIndex({ "isFolder": 1 });
db.files.createIndex({ "name": "text", "metadata.description": "text" });
db.files.createIndex({ "createdAt": 1 });
db.files.createIndex({ "updatedAt": 1 });

// Create a collection for application settings
db.createCollection('settings');
db.settings.insertOne({
    _id: 'app_config',
    version: '1.0.0',
    createdAt: new Date(),
    features: {
        searchEnabled: true,
        downloadEnabled: true,
        uploadEnabled: false,
        realTimeUpdates: true
    }
});

// Create a collection for system logs
db.createCollection('system_logs');
db.system_logs.createIndex({ "timestamp": 1 });
db.system_logs.createIndex({ "level": 1 });

print('MongoDB initialization completed successfully');
print('Database: test-report-dashboard');
print('User: app_user');
print('Indexes created for files collection');
print('Settings and logs collections created');

