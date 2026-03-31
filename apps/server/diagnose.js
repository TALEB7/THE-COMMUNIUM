// Diagnostic script to identify NestJS boot failure
require('dotenv').config();
const net = require('net');
const { execSync } = require('child_process');

async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

async function main() {
  console.log('=== ENVIRONMENT ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
  console.log('REDIS_URL:', process.env.REDIS_URL || 'NOT SET');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
  console.log('PORT:', process.env.PORT || 'NOT SET');

  console.log('\n=== PORT CHECKS ===');
  const pg = await checkPort('localhost', 5432);
  console.log('PostgreSQL (5432):', pg ? 'OPEN' : 'CLOSED');
  const redis = await checkPort('localhost', 6379);
  console.log('Redis (6379):', redis ? 'OPEN' : 'CLOSED');
  const meili = await checkPort('localhost', 7700);
  console.log('Meilisearch (7700):', meili ? 'OPEN' : 'CLOSED');
  const nest = await checkPort('localhost', 4000);
  console.log('NestJS (4000):', nest ? 'OPEN' : 'CLOSED');

  if (pg) {
    console.log('\n=== PRISMA CONNECTION TEST ===');
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log('Prisma: CONNECTED SUCCESSFULLY');
      const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
      console.log('Tables found:', tables.map(t => t.tablename).join(', ') || 'NONE');
      await prisma.$disconnect();
    } catch(e) {
      console.error('Prisma ERROR:', e.message);
    }
  }

  console.log('\n=== NESTJS BOOT ATTEMPT ===');
  try {
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/app.module');
    const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
    console.log('NestJS: CREATED SUCCESSFULLY');
    await app.close();
  } catch(e) {
    console.error('NestJS BOOT ERROR:', e.message);
    if (e.stack) console.error('Stack:', e.stack.split('\n').slice(0,10).join('\n'));
  }
}

main().then(() => process.exit(0)).catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
