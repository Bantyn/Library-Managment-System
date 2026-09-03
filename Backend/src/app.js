const express = require('express');
const cors = require('cors');
const path = require('path');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const memberRoutes = require('./routes/memberRoutes');
const issueRoutes = require('./routes/issueRoutes');
const returnRoutes = require('./routes/returnRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const fineRoutes = require('./routes/fineRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const trashRoutes = require('./routes/trashRoutes');

// Import services & startup synchronizers
const inventoryService = require('./services/inventoryService');
const syncExistingLibraryCards = require('./utils/syncLibraryCards');
const cookieParser = require('cookie-parser');

// Import error handlers
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Allowed frontend origins for HTTP-Only cookie credentials
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

// Global Middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev & testing
      }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded book images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Library Management System API is running...',
    version: '1.0.0',
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Library Management System API v1.0',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      categories: '/api/categories',
      members: '/api/members',
      issues: '/api/issues',
      returns: '/api/returns',
      dashboard: '/api/dashboard',
      purchases: '/api/purchases',
      fines: '/api/fines',
      inventory: '/api/inventory',
      reports: '/api/reports',
      trash: '/api/trash',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/trash', trashRoutes);

// Automatic physical inventory & library card synchronization on startup
setTimeout(() => {
  inventoryService.syncAllExistingBooks().catch((e) => {
    console.warn('Initial inventory sync notice:', e.message);
  });
  syncExistingLibraryCards().catch((e) => {
    console.warn('Initial library card sync notice:', e.message);
  });
}, 1500);

// 404 handler for undefined routes
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
