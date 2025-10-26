#!/bin/bash

# Quick Development Build Script
# Fast builds for local development and testing

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Default values
TAG="dev-$(date +%Y%m%d-%H%M%S)"
USERNAME="lykny97"

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
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

BACKEND_IMAGE="lykny97/takingnote-backend:$TAG"
FRONTEND_IMAGE="lykny97/takingnote-frontend:$TAG"

log_info "Quick Development Build"
log_info "Tag: $TAG"

# Build backend (single platform for speed)
log_info "Building backend..."
docker buildx build \
    --platform linux/amd64 \
    -t $BACKEND_IMAGE \
    --load \
    ./apps/backend

log_success "Backend built: $BACKEND_IMAGE"

# Build frontend (single platform for speed)
log_info "Building frontend..."
docker buildx build \
    --platform linux/amd64 \
    -t $FRONTEND_IMAGE \
    --load \
    ./apps/frontend

log_success "Frontend built: $FRONTEND_IMAGE"

log_success "Development build complete! 🚀"
log_info "Test locally with:"
log_info "  Backend: docker run --rm -p 3000:3000 $BACKEND_IMAGE"
log_info "  Frontend: docker run --rm -p 8080:80 $FRONTEND_IMAGE"
