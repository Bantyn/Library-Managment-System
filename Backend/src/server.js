const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
    try {
        // 1. Connect to MongoDB
        await connectDB();

        // 2. Automatically ensure default admin exists
        await seedAdmin();

        // 3. Start listening on PORT
        const server = app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(`Library Management Backend running on port ${PORT}`);
            console.log(`API Base URL: http://localhost:${PORT}/api`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`====================================================`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.error(`Unhandled Rejection: ${err.message}`);
            server.close(() => process.exit(1));
        });
    } catch (error) {
        console.error(`Server initialization failed: ${error.message}`);
        process.exit(1);
    }
};

startServer();
