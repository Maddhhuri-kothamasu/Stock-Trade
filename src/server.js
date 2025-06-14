require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const tradeRoutes = require('./routes/tradesRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging middleware (for development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    
    // Log incoming request
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('   Body:', JSON.stringify(req.body, null, 2));
    }
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - start;
      console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      if (data && res.statusCode < 400) {
        try {
          const responseData = JSON.parse(data);
          console.log('   Response:', JSON.stringify(responseData, null, 2));
        } catch (e) {
          console.log('   Response:', data);
        }
      }
      console.log('---');
      return originalSend.call(this, data);
    };
    
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Stock Trades API'
  });
});

// API routes
app.use('/', authRoutes);
app.use('/trades', tradeRoutes);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(` Stock Trades API server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app; 