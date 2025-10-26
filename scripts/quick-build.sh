#!/bin/bash

# Quick Build Script for Document Community Hub
# Simplified version for common build scenarios
# ./scripts/quick-build.sh --tag latest-fixed

set -e

# Default values
REGISTRY="docker.io"
USERNAME="lykny97"
TAG="latest"
PLATFORMS="linux/amd64,linux/arm64"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tag)
            TAG="$2"
            shift 2
            ;;
        --username)
            USERNAME="$2"
            shift 2
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --platform)
            PLATFORMS="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--tag TAG] [--username USERNAME] [--registry REGISTRY] [--platform PLATFORM]"
            echo "Example: $0 --tag v1.0.0"
            exit 0
            ;;
        *)
            echo "Usage: $0 [--tag TAG] [--username USERNAME] [--registry REGISTRY] [--platform PLATFORM]"
            echo "Example: $0 --tag v1.0.0"
            exit 1
            ;;
    esac
done

BACKEND_IMAGE="$REGISTRY/$USERNAME/takingnote-backend:$TAG"
FRONTEND_IMAGE="$REGISTRY/$USERNAME/takingnote-frontend:$TAG"

log_info "Quick build for Document Community Hub"
log_info "Backend: $BACKEND_IMAGE"
log_info "Frontend: $FRONTEND_IMAGE"
log_info "Platforms: $PLATFORMS"

# Create buildx builder if needed
if ! docker buildx inspect multiarch >/dev/null 2>&1; then
    log_info "Creating buildx builder..."
    docker buildx create --name multiarch --driver docker-container --use
    docker buildx inspect --bootstrap
fi

# Build backend
log_info "Building backend..."
docker buildx build \
    --platform $PLATFORMS \
    -t $BACKEND_IMAGE \
    --cache-from type=registry,ref=$BACKEND_IMAGE \
    --cache-to type=registry,ref=$BACKEND_IMAGE,mode=max \
    --push \
    ./apps/backend

log_success "Backend built and pushed: $BACKEND_IMAGE"

# Build frontend
log_info "Building frontend..."
docker buildx build \
    --platform $PLATFORMS \
    -t $FRONTEND_IMAGE \
    --cache-from type=registry,ref=$FRONTEND_IMAGE \
    --cache-to type=registry,ref=$FRONTEND_IMAGE,mode=max \
    --push \
    ./apps/frontend

log_success "Frontend built and pushed: $FRONTEND_IMAGE"

log_success "All images built and pushed successfully! 🚀"