const express = require('express');
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createTradeSchema, tradeQuerySchema, tradeIdSchema } = require('../utils/validationSchemas');

const router = express.Router();

// All trade routes require authentication
router.use(authenticateToken);

/**
 * POST /trades - Create a new trade
 * Request body: { type, user_id, symbol, shares, price }
 */
router.post('/', validate(createTradeSchema), async (req, res, next) => {
  try {
    const { type, user_id, symbol, shares, price } = req.body;

    const trade = await prisma.trade.create({
      data: {
        type,
        userId: user_id,
        symbol: symbol.toUpperCase(), // Normalize symbol to uppercase
        shares,
        price: parseFloat(price),
        timestamp: new Date()
      }
    });

    // Transform response to API specification format
    const responseTradeData = {
      id: trade.id,
      type: trade.type,
      user_id: trade.userId,
      symbol: trade.symbol,
      shares: trade.shares,
      price: trade.price,
      timestamp: trade.timestamp.getTime() // Convert DateTime to UNIX timestamp
    };

    res.status(201).json(responseTradeData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /trades - Get all trades with optional filtering
 * Query params: ?type=buy|sell&user_id=123
 */
router.get('/', validate(tradeQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { type, user_id } = req.query;

    // Build dynamic filter conditions
    const where = {};
    if (type) where.type = type;
    if (user_id) where.userId = parseInt(user_id);

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { id: 'asc' } // Order by ID as per specification
    });

    // Transform all trades to API format
    const responseData = trades.map(trade => ({
      id: trade.id,
      type: trade.type,
      user_id: trade.userId,
      symbol: trade.symbol,
      shares: trade.shares,
      price: trade.price,
      timestamp: trade.timestamp.getTime()
    }));

    res.json(responseData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /trades/:id - Get specific trade by ID
 */
router.get('/:id', validate(tradeIdSchema, 'params'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const trade = await prisma.trade.findUnique({
      where: { id: parseInt(id) }
    });

    if (!trade) {
      return res.status(404).json({
        error: 'Trade not found'
      });
    }

    // Transform single trade to API format
    const responseData = {
      id: trade.id,
      type: trade.type,
      user_id: trade.userId,
      symbol: trade.symbol,
      shares: trade.shares,
      price: trade.price,
      timestamp: trade.timestamp.getTime()
    };

    res.json(responseData);
  } catch (error) {
    next(error);
  }
});

// Trade modification/deletion is not allowed per specification
router.put('/:id', (req, res) => {
  res.status(405).json({
    error: 'Method not allowed',
    message: 'Trade modification is not permitted'
  });
});

router.patch('/:id', (req, res) => {
  res.status(405).json({
    error: 'Method not allowed',
    message: 'Trade modification is not permitted'
  });
});

router.delete('/:id', (req, res) => {
  res.status(405).json({
    error: 'Method not allowed',
    message: 'Trade deletion is not permitted'
  });
});

module.exports = router; 