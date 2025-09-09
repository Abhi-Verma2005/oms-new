// Safe dynamic import to avoid build-time type errors if Prisma client isn't generated
// and to keep deployment environments lenient.
// eslint-disable-next-line @typescript-eslint/no-var-requires
let PrismaClient: any;
let prismaInstance: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaClient = require('@prisma/client').PrismaClient;
  console.log('✅ PrismaClient imported successfully');
} catch (e) {
  console.error('❌ Failed to import PrismaClient:', e);
  PrismaClient = class {
    constructor() {
      throw new Error('PrismaClient not available');
    }
  };
}

// Loosen typing to avoid strict coupling to Prisma types at build time
// while preserving the runtime behavior when Prisma is available.
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

function createPrismaClient() {
  if (!PrismaClient || typeof PrismaClient !== 'function') {
    console.error('❌ PrismaClient is not available');
    return null;
  }
  
  try {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('❌ Failed to create PrismaClient instance:', error);
    return null;
  }
}

export const prisma = (() => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  
  const instance = createPrismaClient();
  if (instance) {
    globalForPrisma.prisma = instance;
    console.log('✅ Prisma client initialized successfully');
  } else {
    console.error('❌ Failed to initialize Prisma client');
  }
  
  return instance;
})();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}


