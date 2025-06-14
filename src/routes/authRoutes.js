const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { validate } = require('../middleware/validationMiddleware');
const { signupSchema, loginSchema } = require('../utils/validationSchemas');

const router = express.Router();

// Signup endpoint
router.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(201).json({
      message: 'User created successfully',
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// Login endpoint
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token endpoint
router.post('/token/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });

    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Refresh token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }

    next(error);
  }
});

module.exports = router; 