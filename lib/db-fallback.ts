// Fallback database service when Prisma is not available
export class FallbackDatabaseService {
  private static instance: FallbackDatabaseService;
  
  static getInstance(): FallbackDatabaseService {
    if (!FallbackDatabaseService.instance) {
      FallbackDatabaseService.instance = new FallbackDatabaseService();
    }
    return FallbackDatabaseService.instance;
  }
  
  // Mock database operations that return empty results or throw helpful errors
  get user() {
    return {
      findUnique: async (args: any) => {
        console.error('❌ Database not available - user.findUnique called with:', args);
        throw new Error('Database not available - user.findUnique');
      },
      findMany: async (args: any) => {
        console.error('❌ Database not available - user.findMany called with:', args);
        throw new Error('Database not available - user.findMany');
      },
      create: async (args: any) => {
        console.error('❌ Database not available - user.create called with:', args);
        throw new Error('Database not available - user.create');
      },
      update: async (args: any) => {
        console.error('❌ Database not available - user.update called with:', args);
        throw new Error('Database not available - user.update');
      },
      delete: async (args: any) => {
        console.error('❌ Database not available - user.delete called with:', args);
        throw new Error('Database not available - user.delete');
      }
    };
  }
  
  get notification() {
    return {
      findUnique: async (args: any) => {
        console.error('❌ Database not available - notification.findUnique called with:', args);
        throw new Error('Database not available - notification.findUnique');
      },
      findMany: async (args: any) => {
        console.error('❌ Database not available - notification.findMany called with:', args);
        throw new Error('Database not available - notification.findMany');
      },
      create: async (args: any) => {
        console.error('❌ Database not available - notification.create called with:', args);
        throw new Error('Database not available - notification.create');
      },
      update: async (args: any) => {
        console.error('❌ Database not available - notification.update called with:', args);
        throw new Error('Database not available - notification.update');
      },
      delete: async (args: any) => {
        console.error('❌ Database not available - notification.delete called with:', args);
        throw new Error('Database not available - notification.delete');
      }
    };
  }
  
  get onboardingProfile() {
    return {
      findUnique: async (args: any) => {
        console.error('❌ Database not available - onboardingProfile.findUnique called with:', args);
        throw new Error('Database not available - onboardingProfile.findUnique');
      },
      findMany: async (args: any) => {
        console.error('❌ Database not available - onboardingProfile.findMany called with:', args);
        throw new Error('Database not available - onboardingProfile.findMany');
      },
      create: async (args: any) => {
        console.error('❌ Database not available - onboardingProfile.create called with:', args);
        throw new Error('Database not available - onboardingProfile.create');
      },
      update: async (args: any) => {
        console.error('❌ Database not available - onboardingProfile.update called with:', args);
        throw new Error('Database not available - onboardingProfile.update');
      },
      delete: async (args: any) => {
        console.error('❌ Database not available - onboardingProfile.delete called with:', args);
        throw new Error('Database not available - onboardingProfile.delete');
      }
    };
  }
  
  get userRole() {
    return {
      findUnique: async (args: any) => {
        console.error('❌ Database not available - userRole.findUnique called with:', args);
        throw new Error('Database not available - userRole.findUnique');
      },
      findMany: async (args: any) => {
        console.error('❌ Database not available - userRole.findMany called with:', args);
        throw new Error('Database not available - userRole.findMany');
      },
      create: async (args: any) => {
        console.error('❌ Database not available - userRole.create called with:', args);
        throw new Error('Database not available - userRole.create');
      },
      update: async (args: any) => {
        console.error('❌ Database not available - userRole.update called with:', args);
        throw new Error('Database not available - userRole.update');
      },
      delete: async (args: any) => {
        console.error('❌ Database not available - userRole.delete called with:', args);
        throw new Error('Database not available - userRole.delete');
      }
    };
  }
  
  get role() {
    return {
      findUnique: async (args: any) => {
        console.error('❌ Database not available - role.findUnique called with:', args);
        throw new Error('Database not available - role.findUnique');
      },
      findMany: async (args: any) => {
        console.error('❌ Database not available - role.findMany called with:', args);
        throw new Error('Database not available - role.findMany');
      },
      create: async (args: any) => {
        console.error('❌ Database not available - role.create called with:', args);
        throw new Error('Database not available - role.create');
      },
      update: async (args: any) => {
        console.error('❌ Database not available - role.update called with:', args);
        throw new Error('Database not available - role.update');
      },
      delete: async (args: any) => {
        console.error('❌ Database not available - role.delete called with:', args);
        throw new Error('Database not available - role.delete');
      }
    };
  }
  
  get notificationType() {
    return {
      findUnique: async (args: any) => {
        console.error('❌ Database not available - notificationType.findUnique called with:', args);
        throw new Error('Database not available - notificationType.findUnique');
      },
      findMany: async (args: any) => {
        console.error('❌ Database not available - notificationType.findMany called with:', args);
        throw new Error('Database not available - notificationType.findMany');
      },
      create: async (args: any) => {
        console.error('❌ Database not available - notificationType.create called with:', args);
        throw new Error('Database not available - notificationType.create');
      },
      update: async (args: any) => {
        console.error('❌ Database not available - notificationType.update called with:', args);
        throw new Error('Database not available - notificationType.update');
      },
      delete: async (args: any) => {
        console.error('❌ Database not available - notificationType.delete called with:', args);
        throw new Error('Database not available - notificationType.delete');
      }
    };
  }
}
