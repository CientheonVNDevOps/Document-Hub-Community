# Use the official Bun image
FROM oven/bun:1 as base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine as production

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --production

# Copy built application from base stage
COPY --from=base /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["bun", "run", "start:prod"]
