# =============================================================================
# Simple and Reliable Dockerfile for Next.js + Prisma
# Based on proven patterns from web research
# =============================================================================

FROM node:22-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl dumb-init curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Copy Prisma schema first (needed for postinstall script)
COPY prisma ./prisma

# Install dependencies (this will run postinstall script which includes prisma generate)
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile && pnpm approve-builds; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "No lockfile found" && exit 1; \
  fi

# Copy the rest of the application code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV AUTH_SECRET="dummy-secret-for-build"
ENV AUTH_URL="http://localhost:3000"
ENV AUTH_GOOGLE_ID="dummy"
ENV AUTH_GOOGLE_SECRET="dummy"
ENV NEXT_PUBLIC_GEMINI_API_KEY="dummy"
ENV STRIPE_SECRET_KEY="sk_test_dummy"
ENV STRIPE_WEBHOOK_SECRET="whsec_dummy"
ENV NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3000"
ENV NEXT_PUBLIC_AUTH_URL="http://localhost:3000"
ENV SMTP_HOST="localhost"
ENV SMTP_PORT="587"
ENV SMTP_USER="dummy"
ENV SMTP_PASS="dummy"
ENV EMAIL_FROM="dummy@localhost"
ENV JWT_SECRET="dummy-jwt-secret"
ENV OPEN_AI_KEY="dummy"
ENV PRISMA_TELEMETRY_INFORMATION='{"is_docker":true}'

# Build the application
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    pnpm build; \
  else \
    npm run build; \
  fi

# Production image
FROM node:22-alpine AS production

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl dumb-init curl

# Enable pnpm for production dependencies
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PRISMA_TELEMETRY_INFORMATION='{"is_docker":true}'

# Copy package files for production dependencies
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/package-lock.json* ./package-lock.json*
COPY --from=base /app/pnpm-lock.yaml* ./pnpm-lock.yaml*

# Install only production dependencies
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    pnpm install --prod --frozen-lockfile --ignore-scripts; \
  elif [ -f package-lock.json ]; then \
    npm ci --only=production --ignore-scripts; \
  else \
    echo "No lockfile found" && exit 1; \
  fi

# Copy Prisma client and generated files
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/server.js ./

# Handle ws-server directory (create stub if missing)
RUN if [ -d "/app/ws-server" ]; then \
      cp -r /app/ws-server ./ws-server; \
    else \
      mkdir -p ./ws-server/src; \
      echo "module.exports = { notificationWebSocketServer: { createWebSocketServer: () => {} } };" > ./ws-server/src/websocket-server.js; \
    fi

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/hello || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
