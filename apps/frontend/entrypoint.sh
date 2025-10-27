#!/bin/sh
# Entrypoint script to replace API URL at runtime in the built files
echo "Starting frontend with API URL: ${VITE_API_URL:-http://dc0kc00ko8cgo84k4ok4w0kw.72.60.41.15.sslip.io}"

# Replace the hardcoded localhost URLs with the actual API URL
find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.mjs" -o -name "*.html" \) | while read file; do
    sed -i \
    -e "s|http://localhost:3002|${VITE_API_URL:-http://dc0kc00ko8cgo84k4ok4w0kw.72.60.41.15.sslip.io}|g" \
    -e "s|http://localhost:3000|${VITE_API_URL:-http://dc0kc00ko8cgo84k4ok4w0kw.72.60.41.15.sslip.io}|g" \
    "$file" 2>/dev/null || true
done

echo "API URL substitution complete. Starting nginx..."
exec "$@"

