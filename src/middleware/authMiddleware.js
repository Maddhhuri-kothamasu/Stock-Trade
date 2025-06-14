const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to authenticate JWT tokens for protected routes
 */
const authenticateToken = (req, res, next) => {
  // Extract token from Authorization header (Bearer TOKEN)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required' 
    });
  }

  try {
    // Verify token and attach user data to request
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access token expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid access token' 
      });
    }

    return res.status(500).json({ 
      error: 'Token verification failed' 
    });
  }
};

module.exports = { authenticateToken }; 