// Production server for frontend
import { serve } from "bun";
import { readFileSync, existsSync, statSync } from "fs";
import { join, extname, resolve, dirname } from "path";

const port = parseInt(process.env.PORT || "3000", 10);
const distPath = resolve(process.cwd(), "dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject"
};

// Verify dist directory exists
if (!existsSync(distPath)) {
  console.error(`Error: Dist directory not found at ${distPath}`);
  console.error(`Current working directory: ${process.cwd()}`);
  process.exit(1);
}

console.log(`Server starting on port ${port}`);
console.log(`Serving from: ${distPath}`);
console.log(`Dist directory exists: ${existsSync(distPath)}`);

serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Health check endpoint
    if (pathname === "/health") {
      return new Response("healthy", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Handle root path and static assets
    let filePath = pathname === "/" ? "/index.html" : pathname;
    
    // Remove leading slash for path resolution
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    filePath = join(distPath, cleanPath);

    // Debug: Log the file path being checked
    console.log(`Request: ${pathname} -> Checking: ${filePath}`);

    // Serve static files if they exist
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath);
        const ext = extname(pathname);
        const contentType = mimeTypes[ext] || "application/octet-stream";
        
        return new Response(content, {
          headers: { 
            "Content-Type": contentType,
            "Cache-Control": ext === ".html" 
              ? "no-cache, no-store, must-revalidate"
              : "public, max-age=31536000, immutable"
          }
        });
      } catch (error) {
        console.error(`Error serving file: ${filePath}`, error);
      }
    }

    // Fallback to index.html for client-side routing (SPA)
    const indexPath = join(distPath, "index.html");
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath);
      return new Response(content, {
        headers: { 
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
    }

    // Log error if index.html doesn't exist
    console.error(`Cannot find index.html at ${indexPath}`);

    return new Response("Not Found", { status: 404 });
  }
});

console.log(`Server running at http://localhost:${port}/`);

