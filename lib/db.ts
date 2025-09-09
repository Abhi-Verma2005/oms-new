// Safe dynamic import to avoid build-time type errors if Prisma client isn't generated
// and to keep deployment environments lenient.
// eslint-disable-next-line @typescript-eslint/no-var-requires
let PrismaClient: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (e) {
  PrismaClient = class {};
}

// Loosen typing to avoid strict coupling to Prisma types at build time
// while preserving the runtime behavior when Prisma is available.
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


