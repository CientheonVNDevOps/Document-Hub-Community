# Coolify Deployment Guide

This guide explains how to deploy the TakingNote Community Cientheon application to Coolify.

## Prerequisites

1. Coolify instance running
2. Docker registry access (Docker Hub, GitHub Container Registry, or private registry)
3. Database and Redis instances (can be managed services or separate containers)

## Deployment Steps

### 1. Push Docker Images to Registry

First, tag and push your Docker images to a registry:

```bash
# Tag images for your registry
docker tag takingnote-backend:latest your-registry/takingnote-backend:latest
docker tag takingnote-frontend:latest your-registry/takingnote-frontend:latest

# Push to registry
docker push your-registry/takingnote-backend:latest
docker push your-registry/takingnote-frontend:latest
```

### 2. Create Applications in Coolify

#### Backend Application

1. **Create New Application**
   - Go to Coolify dashboard
   - Click "New Application"
   - Choose "Docker Compose" as the source

2. **Configure Backend**
   - Use the `coolify-backend.yml` file
   - Set the following environment variables:
     - `DATABASE_URL`: PostgreSQL connection string
     - `REDIS_URL`: Redis connection string
     - `JWT_SECRET`: Strong secret key for JWT tokens

3. **Database Setup**
   - Ensure PostgreSQL is accessible from the backend
   - Run database migrations if needed

#### Frontend Application

1. **Create New Application**
   - Go to Coolify dashboard
   - Click "New Application"
   - Choose "Docker Compose" as the source

2. **Configure Frontend**
   - Use the `coolify-frontend.yml` file
   - No additional environment variables needed for frontend

### 3. Network Configuration

Create a shared network for both applications:

```bash
docker network create takingnote-network
```

### 4. Environment Variables

#### Backend Environment Variables
```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://host:port
JWT_SECRET=your-very-secure-jwt-secret-key
PORT=3000
```

#### Frontend Environment Variables
```
NODE_ENV=production
```

### 5. Domain Configuration

1. **Backend Domain**
   - Configure domain for API (e.g., `api.takingnote.com`)
   - Ensure CORS is configured for frontend domain

2. **Frontend Domain**
   - Configure domain for frontend (e.g., `takingnote.com`)
   - Set up SSL certificates

### 6. Health Checks

Both applications include health check endpoints:
- Backend: `http://backend:3000/health`
- Frontend: `http://frontend/health`

### 7. Monitoring and Logs

- Use Coolify's built-in monitoring
- Set up log aggregation if needed
- Monitor resource usage

## Production Considerations

### Security
- Use strong JWT secrets
- Enable HTTPS for all endpoints
- Configure proper CORS settings
- Use environment variables for sensitive data

### Performance
- Configure appropriate resource limits
- Set up caching strategies
- Monitor database performance
- Use CDN for static assets

### Backup
- Regular database backups
- Application state backups
- Configuration backups

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database is accessible

2. **Redis Connection Issues**
   - Verify REDIS_URL format
   - Check Redis service status
   - Verify network connectivity

3. **Frontend Not Loading**
   - Check nginx configuration
   - Verify static file serving
   - Check browser console for errors

### Logs
- Backend logs: `docker logs takingnote-backend`
- Frontend logs: `docker logs takingnote-frontend`

## Maintenance

### Updates
1. Build new Docker images
2. Push to registry
3. Update applications in Coolify
4. Test functionality

### Scaling
- Use Coolify's scaling features
- Monitor resource usage
- Adjust based on traffic patterns
