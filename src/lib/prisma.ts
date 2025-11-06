import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development (hot-reloading)
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export default prisma;
