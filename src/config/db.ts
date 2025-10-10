import mongoose from 'mongoose';

// Set mongoose options to avoid deprecation warnings
mongoose.set('strictQuery', false);

export interface DatabaseConfig {
    uri: string;
    options: mongoose.ConnectOptions;
}

export const getDatabaseConfig = (): DatabaseConfig => {
    return {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test-report-dashboard',
        options: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }
    };
};

export const connectDatabase = async (): Promise<void> => {
    try {
        const config = getDatabaseConfig();
        await mongoose.connect(config.uri, config.options);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
        console.error('❌ MongoDB disconnection failed:', error);
    }
};

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
});
