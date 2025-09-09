import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import DiscordProvider from "next-auth/providers/discord"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import { ActivityLogger } from "@/lib/activity-logger"
import * as bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          if (!prisma) {
            console.error("Prisma client not available")
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user) {
            console.log("User not found:", credentials.email)
            return null
          }

          if (!user.password) {
            console.log("User has no password set")
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password)
          
          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.email)
            return null
          }
          
          console.log("Authentication successful for user:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
    jwt: async ({ token, user, trigger, account }) => {
      if (user) {
        try {
          if (!prisma) {
            console.error("Prisma client not available in JWT callback");
            token.roles = [];
            token.permissions = [];
            token.isAdmin = false;
            return token;
          }

          const userWithRoles = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              userRoles: {
                where: { isActive: true },
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              }
            }
          });

          if (userWithRoles) {
            const roles = userWithRoles.userRoles.map((ur: any) => ur.role.name);
            const permissions = userWithRoles.userRoles.flatMap((ur: any) => 
              ur.role.rolePermissions.map((rp: any) => rp.permission.name)
            );
            
            token.roles = roles;
            token.permissions = permissions;
            token.isAdmin = roles.includes('admin');

            try {
              await ActivityLogger.logAuth(
                user.id,
                'USER_SIGNIN',
                `User signed in via ${user.email}`,
                {
                  provider: account?.provider || 'credentials',
                  roles: roles,
                  isAdmin: roles.includes('admin')
                }
              );
            } catch (activityError) {
              console.error('Error logging auth activity:', activityError);
            }
          }
        } catch (error) {
          console.error('Error fetching user roles in JWT callback:', error);
          token.roles = [];
          token.permissions = [];
          token.isAdmin = false;
        }
      }
      return token
    },
    session: ({ session, token }) => {
      console.log('Session callback - token:', token)
      console.log('Session callback - session:', session)
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          roles: (token.roles as string[]) || [],
          permissions: (token.permissions as string[]) || [],
          isAdmin: (token.isAdmin as boolean) || false,
        },
      }
    },
    // authorized is not part of v4 options; handled via middleware
  },
  pages: {
    signIn: '/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

export const { handlers, signIn, signOut } = NextAuth(authOptions)
export async function auth() {
  return getServerSession(authOptions)
}


