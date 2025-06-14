const request = require('supertest');
const app = require('../src/server');
const prisma = require('../src/config/database');

describe('Trade Endpoints', () => {
  let accessToken;
  let userId;

  beforeEach(async () => {
    // Clean up test data
    await prisma.trade.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user and get access token
    const signupResponse = await request(app)
      .post('/signup')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    accessToken = signupResponse.body.accessToken;
    userId = signupResponse.body.user.id;
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.trade.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /trades', () => {
    it('should create a new trade successfully', async () => {
      const tradeData = {
        type: 'buy',
        user_id: userId,
        symbol: 'AAPL',
        shares: 50,
        price: 150.25
      };

      const response = await request(app)
        .post('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tradeData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'buy');
      expect(response.body).toHaveProperty('user_id', userId);
      expect(response.body).toHaveProperty('symbol', 'AAPL');
      expect(response.body).toHaveProperty('shares', 50);
      expect(response.body).toHaveProperty('price', 150.25);
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });

    it('should return 401 without authorization token', async () => {
      const tradeData = {
        type: 'buy',
        user_id: userId,
        symbol: 'AAPL',
        shares: 50,
        price: 150.25
      };

      const response = await request(app)
        .post('/trades')
        .send(tradeData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should return 400 for invalid trade type', async () => {
      const tradeData = {
        type: 'invalid',
        user_id: userId,
        symbol: 'AAPL',
        shares: 50,
        price: 150.25
      };

      const response = await request(app)
        .post('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tradeData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for shares out of range', async () => {
      const tradeData = {
        type: 'buy',
        user_id: userId,
        symbol: 'AAPL',
        shares: 150, // Above max of 100
        price: 150.25
      };

      const response = await request(app)
        .post('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tradeData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for missing required fields', async () => {
      const tradeData = {
        type: 'buy',
        // Missing user_id, symbol, shares, price
      };

      const response = await request(app)
        .post('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tradeData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /trades', () => {
    beforeEach(async () => {
      // Create test trades
      await request(app)
        .post('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'buy',
          user_id: userId,
          symbol: 'AAPL',
          shares: 50,
          price: 150.25
        });

      await request(app)
        .post('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'sell',
          user_id: userId,
          symbol: 'GOOGL',
          shares: 25,
          price: 2500.00
        });
    });

    it('should get all trades successfully', async () => {
      const response = await request(app)
        .get('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('type');
      expect(response.body[0]).toHaveProperty('user_id');
      expect(response.body[0]).toHaveProperty('symbol');
      expect(response.body[0]).toHaveProperty('shares');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('timestamp');
    });

    it('should filter trades by type', async () => {
      const response = await request(app)
        .get('/trades?type=buy')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('type', 'buy');
    });

    it('should filter trades by user_id', async () => {
      const response = await request(app)
        .get(`/trades?user_id=${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      response.body.forEach(trade => {
        expect(trade).toHaveProperty('user_id', userId);
      });
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(app)
        .get('/trades')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('GET /trades/:id', () => {
    let tradeId;

    beforeEach(async () => {
      // Create a test trade
      const tradeResponse = await request(app)
        .post('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'buy',
          user_id: userId,
          symbol: 'AAPL',
          shares: 50,
          price: 150.25
        });

      tradeId = tradeResponse.body.id;
    });

    it('should get trade by ID successfully', async () => {
      const response = await request(app)
        .get(`/trades/${tradeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', tradeId);
      expect(response.body).toHaveProperty('type', 'buy');
      expect(response.body).toHaveProperty('user_id', userId);
      expect(response.body).toHaveProperty('symbol', 'AAPL');
      expect(response.body).toHaveProperty('shares', 50);
      expect(response.body).toHaveProperty('price', 150.25);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent trade ID', async () => {
      const response = await request(app)
        .get('/trades/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Trade not found');
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(app)
        .get(`/trades/${tradeId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('Forbidden HTTP Methods', () => {
    let tradeId;

    beforeEach(async () => {
      // Create a test trade
      const tradeResponse = await request(app)
        .post('/trades')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'buy',
          user_id: userId,
          symbol: 'AAPL',
          shares: 50,
          price: 150.25
        });

      tradeId = tradeResponse.body.id;
    });

    it('should return 405 for PUT /trades/:id', async () => {
      const response = await request(app)
        .put(`/trades/${tradeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ shares: 100 })
        .expect(405);

      expect(response.body).toHaveProperty('error', 'Method not allowed');
      expect(response.body).toHaveProperty('message', 'Trade modification is not permitted');
    });

    it('should return 405 for PATCH /trades/:id', async () => {
      const response = await request(app)
        .patch(`/trades/${tradeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ shares: 100 })
        .expect(405);

      expect(response.body).toHaveProperty('error', 'Method not allowed');
      expect(response.body).toHaveProperty('message', 'Trade modification is not permitted');
    });

    it('should return 405 for DELETE /trades/:id', async () => {
      const response = await request(app)
        .delete(`/trades/${tradeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(405);

      expect(response.body).toHaveProperty('error', 'Method not allowed');
      expect(response.body).toHaveProperty('message', 'Trade deletion is not permitted');
    });
  });
}); 