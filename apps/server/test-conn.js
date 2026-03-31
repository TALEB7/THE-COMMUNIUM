require('dotenv').config();
console.log("DB URL:", process.env.DATABASE_URL);
console.log("REDIS URL:", process.env.REDIS_URL);

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.ping().then(res => console.log('Redis Ping:', res)).catch(e => console.error('Redis Error:', e));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => {
    console.log('Prisma connected successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error('Prisma connection error:', e);
    process.exit(1);
  });
