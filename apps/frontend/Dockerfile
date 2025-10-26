# Single stage build - optimized for Coolify
FROM oven/bun:1-alpine

# Set environment variables to suppress deprecation warnings
ENV NODE_OPTIONS="--no-deprecation"
ENV NODE_NO_WARNINGS=1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies with integrity check disabled for faster builds
RUN bun install --no-verify

# Copy source code
COPY . .

# Build the application with suppressed deprecation warnings
RUN NODE_OPTIONS="--no-deprecation" bun run build

# Create a simple server script
RUN echo 'import { serve } from "bun";' > server.js && \
    echo 'import { readFileSync, existsSync } from "fs";' >> server.js && \
    echo 'import { join, extname } from "path";' >> server.js && \
    echo '' >> server.js && \
    echo 'const port = process.env.PORT || 3000;' >> server.js && \
    echo 'const distPath = "./dist";' >> server.js && \
    echo '' >> server.js && \
    echo 'const mimeTypes = {' >> server.js && \
    echo '  ".html": "text/html",' >> server.js && \
    echo '  ".js": "application/javascript",' >> server.js && \
    echo '  ".css": "text/css",' >> server.js && \
    echo '  ".json": "application/json",' >> server.js && \
    echo '  ".png": "image/png",' >> server.js && \
    echo '  ".jpg": "image/jpeg",' >> server.js && \
    echo '  ".jpeg": "image/jpeg",' >> server.js && \
    echo '  ".gif": "image/gif",' >> server.js && \
    echo '  ".svg": "image/svg+xml",' >> server.js && \
    echo '  ".ico": "image/x-icon"' >> server.js && \
    echo '};' >> server.js && \
    echo '' >> server.js && \
    echo 'serve({' >> server.js && \
    echo '  port,' >> server.js && \
    echo '  async fetch(request) {' >> server.js && \
    echo '    const url = new URL(request.url);' >> server.js && \
    echo '    const pathname = url.pathname;' >> server.js && \
    echo '' >> server.js && \
    echo '    // Health check endpoint - must be first' >> server.js && \
    echo '    if (pathname === "/health") {' >> server.js && \
    echo '      return new Response("healthy", {' >> server.js && \
    echo '        headers: { "Content-Type": "text/plain" }' >> server.js && \
    echo '      });' >> server.js && \
    echo '    }' >> server.js && \
    echo '' >> server.js && \
    echo '    // Handle root path' >> server.js && \
    echo '    let filePath = pathname === "/" ? "/index.html" : pathname;' >> server.js && \
    echo '    filePath = join(distPath, filePath);' >> server.js && \
    echo '' >> server.js && \
    echo '    // Serve static files if they exist' >> server.js && \
    echo '    if (existsSync(filePath)) {' >> server.js && \
    echo '      const content = readFileSync(filePath);' >> server.js && \
    echo '      const ext = extname(pathname);' >> server.js && \
    echo '      const contentType = mimeTypes[ext] || "application/octet-stream";' >> server.js && \
    echo '      return new Response(content, {' >> server.js && \
    echo '        headers: { "Content-Type": contentType }' >> server.js && \
    echo '      });' >> server.js && \
    echo '    }' >> server.js && \
    echo '' >> server.js && \
    echo '    // Fallback to index.html for client-side routing' >> server.js && \
    echo '    const indexPath = join(distPath, "index.html");' >> server.js && \
    echo '    if (existsSync(indexPath)) {' >> server.js && \
    echo '      const content = readFileSync(indexPath);' >> server.js && \
    echo '      return new Response(content, {' >> server.js && \
    echo '        headers: { "Content-Type": "text/html" }' >> server.js && \
    echo '      });' >> server.js && \
    echo '    }' >> server.js && \
    echo '' >> server.js && \
    echo '    return new Response("Not Found", { status: 404 });' >> server.js && \
    echo '  }' >> server.js && \
    echo '});' >> server.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the server with suppressed deprecation warnings
CMD ["bun", "run", "--no-deprecation", "server.js"]
