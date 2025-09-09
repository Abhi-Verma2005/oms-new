// Safe dynamic import to avoid build-time type errors if Prisma client isn't generated
// and to keep deployment environments lenient.
// eslint-disable-next-line @typescript-eslint/no-var-requires
let PrismaClient: any;
let prismaInstance: any = null;

try {
  // Try multiple import paths for different environments
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    PrismaClient = require('@prisma/client').PrismaClient;
    console.log('✅ PrismaClient imported successfully from @prisma/client');
  } catch (e1) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      PrismaClient = require('@prisma/client/default').PrismaClient;
      console.log('✅ PrismaClient imported successfully from @prisma/client/default');
    } catch (e2) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      PrismaClient = require('@prisma/client/index').PrismaClient;
      console.log('✅ PrismaClient imported successfully from @prisma/client/index');
    }
  }
} catch (e) {
  console.error('❌ Failed to import PrismaClient from all paths:', e);
  // Create a mock PrismaClient that throws helpful errors
  PrismaClient = class MockPrismaClient {
    constructor() {
      console.error('❌ PrismaClient not available - using mock client');
    }
    
    // Mock all Prisma methods to throw helpful errors
    get user() {
      return {
        findUnique: () => {
          throw new Error('Prisma client not available - user.findUnique');
        },
        findMany: () => {
          throw new Error('Prisma client not available - user.findMany');
        },
        create: () => {
          throw new Error('Prisma client not available - user.create');
        },
        update: () => {
          throw new Error('Prisma client not available - user.update');
        },
        delete: () => {
          throw new Error('Prisma client not available - user.delete');
        }
      };
    }
    
    get notification() {
      return {
        findUnique: () => {
          throw new Error('Prisma client not available - notification.findUnique');
        },
        findMany: () => {
          throw new Error('Prisma client not available - notification.findMany');
        },
        create: () => {
          throw new Error('Prisma client not available - notification.create');
        },
        update: () => {
          throw new Error('Prisma client not available - notification.update');
        },
        delete: () => {
          throw new Error('Prisma client not available - notification.delete');
        }
      };
    }
    
    get onboardingProfile() {
      return {
        findUnique: () => {
          throw new Error('Prisma client not available - onboardingProfile.findUnique');
        },
        findMany: () => {
          throw new Error('Prisma client not available - onboardingProfile.findMany');
        },
        create: () => {
          throw new Error('Prisma client not available - onboardingProfile.create');
        },
        update: () => {
          throw new Error('Prisma client not available - onboardingProfile.update');
        },
        delete: () => {
          throw new Error('Prisma client not available - onboardingProfile.delete');
        }
      };
    }
    
    get userRole() {
      return {
        findUnique: () => {
          throw new Error('Prisma client not available - userRole.findUnique');
        },
        findMany: () => {
          throw new Error('Prisma client not available - userRole.findMany');
        },
        create: () => {
          throw new Error('Prisma client not available - userRole.create');
        },
        update: () => {
          throw new Error('Prisma client not available - userRole.update');
        },
        delete: () => {
          throw new Error('Prisma client not available - userRole.delete');
        }
      };
    }
    
    get role() {
      return {
        findUnique: () => {
          throw new Error('Prisma client not available - role.findUnique');
        },
        findMany: () => {
          throw new Error('Prisma client not available - role.findMany');
        },
        create: () => {
          throw new Error('Prisma client not available - role.create');
        },
        update: () => {
          throw new Error('Prisma client not available - role.update');
        },
        delete: () => {
          throw new Error('Prisma client not available - role.delete');
        }
      };
    }
    
    get notificationType() {
      return {
        findUnique: () => {
          throw new Error('Prisma client not available - notificationType.findUnique');
        },
        findMany: () => {
          throw new Error('Prisma client not available - notificationType.findMany');
        },
        create: () => {
          throw new Error('Prisma client not available - notificationType.create');
        },
        update: () => {
          throw new Error('Prisma client not available - notificationType.update');
        },
        delete: () => {
          throw new Error('Prisma client not available - notificationType.delete');
        }
      };
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
    return instance;
  } else {
    console.error('❌ Failed to initialize Prisma client - using fallback service');
    // Import fallback service dynamically to avoid circular dependencies
    try {
      const { FallbackDatabaseService } = require('./db-fallback');
      const fallbackInstance = FallbackDatabaseService.getInstance();
      globalForPrisma.prisma = fallbackInstance;
      return fallbackInstance;
    } catch (error) {
      console.error('❌ Failed to load fallback database service:', error);
      return null;
    }
  }
})();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}


