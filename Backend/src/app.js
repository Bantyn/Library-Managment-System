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

// Import services & startup synchronizers
const inventoryService = require('./services/inventoryService');
const syncExistingLibraryCards = require('./utils/syncLibraryCards');

// Import error handlers
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Global Middlewares
app.use(cors());
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
