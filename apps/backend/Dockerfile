# Backend Dockerfile - Optimized for Bun with BuildKit caching
# Build with: docker buildx build --platform linux/amd64 -t your-registry/backend:latest .

# Stage 1: Base image with Bun
FROM oven/bun:1-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies with BuildKit cache mount for faster builds
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Stage 2: Build stage
FROM base AS builder

# Copy source code
COPY . .

# Build the application
# NestJS build is optimized with webpack
RUN bun run build

# Stage 3: Production stage
FROM oven/bun:1-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install only production dependencies with cache mount
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
