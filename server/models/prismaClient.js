// server/models/prismaClient.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    // optional: you can configure log level here
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

export default prisma;
