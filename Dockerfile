# Multi-stage Docker build for Next.js with Prisma
# Based on 2024 best practices

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies without running scripts
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --frozen-lockfile --ignore-scripts; \
  elif [ -f package-lock.json ]; then \
    npm ci --ignore-scripts; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma schema and package.json first
COPY prisma ./prisma
COPY package.json ./

# Set dummy environment variables for build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXTAUTH_SECRET="dummy-secret-for-build"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV GOOGLE_CLIENT_ID="dummy"
ENV GOOGLE_CLIENT_SECRET="dummy"
ENV STRIPE_PUBLISHABLE_KEY="pk_test_dummy"
ENV STRIPE_SECRET_KEY="sk_test_dummy"
ENV STRIPE_WEBHOOK_SECRET="whsec_dummy"
ENV NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3000"
ENV GEMINI_API_KEY="dummy"
ENV EMAIL_SERVER_HOST="localhost"
ENV EMAIL_SERVER_PORT="587"
ENV EMAIL_SERVER_USER="dummy"
ENV EMAIL_SERVER_PASSWORD="dummy"
ENV EMAIL_FROM="dummy@localhost"

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output (if using standalone mode)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy server.js for custom server
COPY --from=builder /app/server.js ./

# Handle ws-server directory (create stub if missing)
RUN if [ -d "/app/ws-server" ]; then \
      cp -r /app/ws-server ./ws-server; \
    else \
      mkdir -p ./ws-server/src; \
      echo "module.exports = { notificationWebSocketServer: { createWebSocketServer: () => {} } };" > ./ws-server/src/websocket-server.js; \
    fi

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/hello || exit 1

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "server.js"]
