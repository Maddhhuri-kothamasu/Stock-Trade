const request = require('supertest');
const app = require('../src/server');
const prisma = require('../src/config/database');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.trade.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.trade.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Create user first time
      await request(app).post('/signup').send(userData);

      // Try to create again
      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'User with this email already exists');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', loginData.email);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });
  });

  describe('POST /token/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create a test user and get refresh token
      const response = await request(app)
        .post('/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/token/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await request(app)
        .post('/token/refresh')
        .send({})
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Refresh token required');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/token/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid refresh token');
    });
  });
}); 