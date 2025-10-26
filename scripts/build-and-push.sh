#!/bin/bash

# Optimized Docker Build and Push Script for Document Community Hub
# Usage: ./scripts/build-and-push.sh [options]
# Options:
#   --registry REGISTRY    Docker registry (default: docker.io)
#   --username USERNAME    Docker username (default: lykny97)
#   --tag TAG             Image tag (default: latest)
#   --platform PLATFORM   Target platform (default: linux/amd64,linux/arm64)
#   --cache               Enable build cache
#   --no-cache            Disable build cache
#   --backend-only        Build only backend
#   --frontend-only       Build only frontend
#   --help               Show this help

set -e

# Default values
REGISTRY="docker.io"
USERNAME="lykny97"
TAG="latest"
PLATFORMS="linux/amd64,linux/arm64"
USE_CACHE=true
BUILD_BACKEND=true
BUILD_FRONTEND=true
PUSH_IMAGES=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Optimized Docker Build and Push Script for Document Community Hub

Usage: $0 [options]

Options:
  --registry REGISTRY    Docker registry (default: docker.io)
  --username USERNAME    Docker username (default: lykny97)
  --tag TAG             Image tag (default: latest)
  --platform PLATFORM   Target platform (default: linux/amd64,linux/arm64)
  --cache               Enable build cache (default)
  --no-cache            Disable build cache
  --backend-only        Build only backend
  --frontend-only       Build only frontend
  --no-push            Build but don't push images
  --help               Show this help

Examples:
  $0                                    # Build and push both images with default settings
  $0 --tag v1.0.0                      # Build and push with specific tag
  $0 --backend-only --no-push          # Build only backend, don't push
  $0 --platform linux/amd64            # Build only for AMD64 platform
  $0 --no-cache                        # Build without cache

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --username)
            USERNAME="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --platform)
            PLATFORMS="$2"
            shift 2
            ;;
        --cache)
            USE_CACHE=true
            shift
            ;;
        --no-cache)
            USE_CACHE=false
            shift
            ;;
        --backend-only)
            BUILD_FRONTEND=false
            shift
            ;;
        --frontend-only)
            BUILD_BACKEND=false
            shift
            ;;
        --no-push)
            PUSH_IMAGES=false
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate inputs
if [[ -z "$REGISTRY" || -z "$USERNAME" || -z "$TAG" ]]; then
    log_error "Registry, username, and tag are required"
    exit 1
fi

# Set image names
BACKEND_IMAGE="$REGISTRY/$USERNAME/takingnote-backend:$TAG"
FRONTEND_IMAGE="$REGISTRY/$USERNAME/takingnote-frontend:$TAG"

log_info "Starting optimized Docker build and push process..."
log_info "Registry: $REGISTRY"
log_info "Username: $USERNAME"
log_info "Tag: $TAG"
log_info "Platforms: $PLATFORMS"
log_info "Use Cache: $USE_CACHE"
log_info "Build Backend: $BUILD_BACKEND"
log_info "Build Frontend: $BUILD_FRONTEND"
log_info "Push Images: $PUSH_IMAGES"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if buildx is available
if ! docker buildx version >/dev/null 2>&1; then
    log_error "Docker buildx is not available. Please install Docker buildx."
    exit 1
fi

# Create and configure buildx builder if needed
BUILDER_NAME="multiarch-builder"
if ! docker buildx inspect $BUILDER_NAME >/dev/null 2>&1; then
    log_info "Creating multi-platform builder..."
    docker buildx create --name $BUILDER_NAME --driver docker-container --use
    docker buildx inspect --bootstrap
else
    log_info "Using existing builder: $BUILDER_NAME"
    docker buildx use $BUILDER_NAME
fi

# Function to build and push image
build_and_push() {
    local service=$1
    local context=$2
    local image_name=$3
    local dockerfile=$4
    
    log_info "Building $service image: $image_name"
    
    # Prepare build arguments
    local build_args="--platform $PLATFORMS -t $image_name"
    
    if [[ "$USE_CACHE" == "true" ]]; then
        # Use registry cache
        build_args="$build_args --cache-from type=registry,ref=$image_name"
        build_args="$build_args --cache-to type=registry,ref=$image_name,mode=max"
    fi
    
    if [[ "$PUSH_IMAGES" == "true" ]]; then
        build_args="$build_args --push"
    else
        build_args="$build_args --load"
    fi
    
    # Add dockerfile if specified
    if [[ -n "$dockerfile" ]]; then
        build_args="$build_args -f $dockerfile"
    fi
    
    # Add context
    build_args="$build_args $context"
    
    log_info "Build command: docker buildx build $build_args"
    
    # Execute build
    if docker buildx build $build_args; then
        log_success "$service image built successfully: $image_name"
    else
        log_error "Failed to build $service image"
        exit 1
    fi
}

# Function to optimize Dockerfile for caching
optimize_dockerfile() {
    local dockerfile=$1
    local service=$2
    
    log_info "Optimizing Dockerfile for $service..."
    
    # Create optimized Dockerfile with better layer caching
    if [[ "$service" == "backend" ]]; then
        cat > "$dockerfile.optimized" << 'EOF'
# Multi-stage build for NestJS backend with Bun
FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Copy package files for production dependencies
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --production

# Copy built application from base stage
COPY --from=base /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["bun", "run", "start:prod"]
EOF
    elif [[ "$service" == "frontend" ]]; then
        cat > "$dockerfile.optimized" << 'EOF'
# Multi-stage build for React frontend
FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built application
COPY --from=base /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
    fi
    
    echo "$dockerfile.optimized"
}

# Build backend if requested
if [[ "$BUILD_BACKEND" == "true" ]]; then
    log_info "Building backend image..."
    
    # Optimize Dockerfile for better caching
    optimized_dockerfile=$(optimize_dockerfile "apps/backend/Dockerfile" "backend")
    
    build_and_push "Backend" "apps/backend" "$BACKEND_IMAGE" "$optimized_dockerfile"
    
    # Clean up optimized Dockerfile
    rm -f "$optimized_dockerfile"
fi

# Build frontend if requested
if [[ "$BUILD_FRONTEND" == "true" ]]; then
    log_info "Building frontend image..."
    
    # Optimize Dockerfile for better caching
    optimized_dockerfile=$(optimize_dockerfile "apps/frontend/Dockerfile" "frontend")
    
    build_and_push "Frontend" "apps/frontend" "$FRONTEND_IMAGE" "$optimized_dockerfile"
    
    # Clean up optimized Dockerfile
    rm -f "$optimized_dockerfile"
fi

# Summary
log_success "Build process completed successfully!"
echo ""
log_info "Image Information:"
if [[ "$BUILD_BACKEND" == "true" ]]; then
    echo "  Backend: $BACKEND_IMAGE"
fi
if [[ "$BUILD_FRONTEND" == "true" ]]; then
    echo "  Frontend: $FRONTEND_IMAGE"
fi
echo ""
log_info "Platforms: $PLATFORMS"
log_info "Cache Enabled: $USE_CACHE"
log_info "Images Pushed: $PUSH_IMAGES"

if [[ "$PUSH_IMAGES" == "true" ]]; then
    log_success "Images are now available on $REGISTRY"
    echo ""
    log_info "You can now deploy these images to Coolify or any other container orchestration platform."
else
    log_info "Images built locally. Use --push to push to registry."
fi

# Clean up buildx builder if it was created
if docker buildx inspect $BUILDER_NAME >/dev/null 2>&1; then
    log_info "Cleaning up buildx builder..."
    docker buildx rm $BUILDER_NAME
fi

log_success "Script completed successfully! 🚀"
