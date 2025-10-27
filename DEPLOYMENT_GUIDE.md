# Production Deployment Guide

## Changes Made to Fix CORS and API URL Issues

### Summary of Changes

1. **Frontend Dockerfile Updates**
   - Added `VITE_API_URL` environment variable with default value: `http://dc0kc00ko8cgo84k4ok4w0kw.72.60.41.15.sslip.io:3000/api`
   - Added runtime URL substitution via `entrypoint.sh` to replace localhost URLs
   - Both `Dockerfile` and `Dockerfile.nginx` updated

2. **Entrypoint Script (`apps/frontend/entrypoint.sh`)**
   - Created new entrypoint that substitutes API URLs at runtime
   - Replaces `http://localhost:3002/api` and `http://localhost:3000/api` with the configured URL
   - Runs before nginx starts

3. **Backend CORS Configuration (`apps/backend/src/main.ts`)**
   - Updated to allow any sslip.io subdomain in production
   - Pattern: `/https?:\/\/[a-z0-9]+\.72\.60\.41\.15\.sslip\.io/`
   - Supports `FRONTEND_URL` environment variable for additional allowed origins

4. **Coolify Configuration**
   - **Frontend** (`coolify-frontend.yml`): Added `VITE_API_URL` env var
   - **Backend** (`coolify-backend.yml`): Added `FRONTEND_URL` env var with default

5. **Service Files Updated**
   - `apps/frontend/src/services/api.ts` - Updated default API URL
   - `apps/frontend/src/services/publicNotesService.ts` - Updated default API URL

## How to Deploy

### Backend Deployment

1. Set the `FRONTEND_URL` environment variable in Coolify:
   ```
   FRONTEND_URL=http://r0s8wcgko4ogs00o8k08444g.72.60.41.15.sslip.io
   ```
   (Replace with your actual frontend domain)

2. Build and deploy the backend:
   ```bash
   cd apps/backend
   docker build -t docker.io/lykny97/takingnote-backend:latest .
   docker push docker.io/lykny97/takingnote-backend:latest
   ```

### Frontend Deployment

1. Build the frontend with the API URL:
   ```bash
   cd apps/frontend
   docker build \
     --build-arg VITE_API_URL=http://dc0kc00ko8cgo84k4ok4w0kw.72.60.41.15.sslip.io:3000/api \
     -t docker.io/lykny97/takingnote-frontend:latest .
   docker push docker.io/lykny97/takingnote-frontend:latest
   ```

2. Or if using the default:
   ```bash
   cd apps/frontend
   docker build -t docker.io/lykny97/takingnote-frontend:latest .
   docker push docker.io/lykny97/takingnote-frontend:latest
   ```

3. The `VITE_API_URL` can be overridden at runtime via environment variable in Coolify

## Configuration

### Environment Variables

**Backend:**
- `FRONTEND_URL`: The frontend URL (comma-separated for multiple)
- `PORT`: Port number (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens
- `NODE_ENV`: Set to `production`

**Frontend:**
- `VITE_API_URL`: Backend API URL (default: `http://dc0kc00ko8cgo84k4ok4w0kw.72.60.41.15.sslip.io:3000/api`)

## How It Works

1. **Build Time**: Vite bundles the `VITE_API_URL` into the JavaScript files
2. **Runtime**: The entrypoint script replaces any remaining localhost URLs with the production URL
3. **CORS**: Backend allows requests from any sslip.io subdomain matching the pattern

## Troubleshooting

### If CORS errors persist:

1. Check that the backend is running in production mode (`NODE_ENV=production`)
2. Verify the `FRONTEND_URL` matches the actual frontend domain
3. Check browser console for the actual origin being sent

### If API calls fail:

1. Verify the `VITE_API_URL` is correct
2. Check that the backend is accessible at that URL
3. Inspect network tab to see the actual URL being called

## Notes

- The backend API has a prefix `/api`
- The backend runs on port 3000 by default
- CORS now allows any subdomain matching `*.72.60.41.15.sslip.io`
- Frontend uses runtime URL substitution for maximum flexibility

