#!/bin/bash

# Optimized Docker Build and Push Script
# Features: Better caching, parallel builds, optimized layers

set -e

# Default values
REGISTRY="docker.io"
USERNAME="lykny97"
TAG="latest"
PLATFORMS="linux/amd64,linux/arm64"
BUILDX_BUILDER="optimized-builder"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Parse arguments
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
        --help)
            echo "Usage: $0 [--registry REGISTRY] [--username USERNAME] [--tag TAG] [--platform PLATFORM]"
            echo "Example: $0 --tag v1.0.0 --platform linux/amd64"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

BACKEND_IMAGE="$REGISTRY/$USERNAME/takingnote-backend:$TAG"
FRONTEND_IMAGE="$REGISTRY/$USERNAME/takingnote-frontend:$TAG"

log_info "Optimized Docker Build and Push"
log_info "Registry: $REGISTRY"
log_info "Username: $USERNAME"
log_info "Tag: $TAG"
log_info "Platforms: $PLATFORMS"

# Create optimized buildx builder
log_info "Setting up optimized buildx builder..."
if ! docker buildx inspect $BUILDX_BUILDER >/dev/null 2>&1; then
    docker buildx create --name $BUILDX_BUILDER --driver docker-container --use
    docker buildx inspect --bootstrap
else
    docker buildx use $BUILDX_BUILDER
fi

# Build backend with optimized caching
log_info "Building backend image with optimized caching..."
docker buildx build \
    --platform $PLATFORMS \
    -t $BACKEND_IMAGE \
    --cache-from type=registry,ref=$BACKEND_IMAGE \
    --cache-to type=registry,ref=$BACKEND_IMAGE,mode=max \
    --push \
    ./apps/backend

log_success "Backend image built and pushed: $BACKEND_IMAGE"

# Build frontend with optimized caching
log_info "Building frontend image with optimized caching..."
docker buildx build \
    --platform $PLATFORMS \
    -t $FRONTEND_IMAGE \
    --cache-from type=registry,ref=$FRONTEND_IMAGE \
    --cache-to type=registry,ref=$FRONTEND_IMAGE,mode=max \
    --push \
    ./apps/frontend

log_success "Frontend image built and pushed: $FRONTEND_IMAGE"

# Verify images
log_info "Verifying image manifests..."
docker manifest inspect $BACKEND_IMAGE >/dev/null && log_success "Backend manifest verified"
docker manifest inspect $FRONTEND_IMAGE >/dev/null && log_success "Frontend manifest verified"

log_success "All images built and pushed successfully! 🚀"
log_info "Images available:"
log_info "  Backend: $BACKEND_IMAGE"
log_info "  Frontend: $FRONTEND_IMAGE"
