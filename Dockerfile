# =============================================================================
# Next.js + Prisma Production Dockerfile
# Based on 2024 best practices from deep web research
# =============================================================================

# Stage 1: Base dependencies
FROM node:22-alpine AS base

# Install system dependencies required for Prisma and other packages
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

# =============================================================================
# Stage 2: Dependencies installation
FROM base AS deps

# Copy package files for better Docker layer caching
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install dependencies without running scripts (to avoid Prisma generate issues)
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    pnpm install --frozen-lockfile --ignore-scripts; \
  elif [ -f package-lock.json ]; then \
    npm ci --ignore-scripts; \
  else \
    echo "No lockfile found" && exit 1; \
  fi

# =============================================================================
# Stage 3: Builder
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma schema first
COPY prisma ./prisma
COPY package.json ./

# Set build-time environment variables (dummy values for build)
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

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    pnpm build; \
  else \
    npm run build; \
  fi

# =============================================================================
# Stage 4: Production runner
FROM base AS runner

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PRISMA_TELEMETRY_INFORMATION='{"is_docker":true}'

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone output (if using standalone mode)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy server.js for custom server
COPY --from=builder /app/server.js ./

# Handle ws-server directory (create stub if missing)
RUN if [ -d "/app/ws-server" ]; then \
      cp -r /app/ws-server ./ws-server; \
    else \
      mkdir -p ./ws-server/src; \
      echo "module.exports = { notificationWebSocketServer: { createWebSocketServer: () => {} } };" > ./ws-server/src/websocket-server.js; \
    fi

# Set correct ownership for all files
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
