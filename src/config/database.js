const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client with environment-specific logging
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Ensure database connection is closed on app shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma; 