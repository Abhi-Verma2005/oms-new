import { prisma } from './db';

export interface ActivityLogData {
  userId: string;
  activity: string;
  // Use a plain string to avoid coupling to Prisma enums at build time
  category: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityLogger {
  static async log(data: ActivityLogData): Promise<void> {
    try {
      await prisma.userActivity.create({
        data: {
          userId: data.userId,
          activity: data.activity,
          category: data.category as any,
          description: data.description,
          // Prisma JSON column expects JsonValue; avoid passing null literal
          metadata: data.metadata ? (data.metadata as any) : undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
    }
  }

  static async logAuth(
    userId: string,
    activity: string,
    description?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      activity,
      category: 'AUTHENTICATION',
      description,
      metadata,
      ipAddress,
      userAgent,
    } as any);
  }
}

export function extractRequestInfo(request: Request) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

