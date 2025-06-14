/**
 * Global error handler middleware
 * Handles database, authentication, and general errors
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle Prisma database errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Unique constraint violation',
      details: 'A record with this data already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found'
    });
  }

  // Handle JWT authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler }; 