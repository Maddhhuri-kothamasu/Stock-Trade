const Joi = require('joi');

// User authentication validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Trade operation validation schemas
const createTradeSchema = Joi.object({
  type: Joi.string().valid('buy', 'sell').required(),
  user_id: Joi.number().integer().positive().required(),
  symbol: Joi.string().required(),
  shares: Joi.number().integer().min(1).max(100).required(), // Business rule: 1-100 shares
  price: Joi.number().positive().required(),
});

// Query parameter validation for filtering trades
const tradeQuerySchema = Joi.object({
  type: Joi.string().valid('buy', 'sell').optional(),
  user_id: Joi.number().integer().positive().optional(),
});

// URL parameter validation for trade ID
const tradeIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  signupSchema,
  loginSchema,
  createTradeSchema,
  tradeQuerySchema,
  tradeIdSchema,
}; 