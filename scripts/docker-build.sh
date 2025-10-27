#!/bin/bash
# Docker build script optimized for macOS and Coolify deployment
# Usage: ./scripts/docker-build.sh [backend|frontend|both] [registry] [tag]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
SERVICE="${1:-both}"
REGISTRY="${2:-localhost:5000}"
TAG="${3:-latest}"

# Enable BuildKit for better caching and performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build function for backend
build_backend() {
    echo -e "${GREEN}Building backend Docker image...${NC}"
    cd apps/backend
    
    # Build with BuildKit optimizations
    docker buildx build \
        --platform linux/amd64 \
        --cache-from type=local,src=/tmp/.buildx-cache \
        --cache-to type=local,dest=/tmp/.buildx-cache,mode=max \
        --tag ${REGISTRY}/takingnote-backend:${TAG} \
        --tag ${REGISTRY}/takingnote-backend:latest \
        --file Dockerfile \
        .
    
    cd ../..
    echo -e "${GREEN}Backend build complete!${NC}"
}

# Build function for frontend
build_frontend() {
    echo -e "${GREEN}Building frontend Docker image...${NC}"
    cd apps/frontend
    
    # Build with BuildKit optimizations
    docker buildx build \
        --platform linux/amd64 \
        --cache-from type=local,src=/tmp/.buildx-cache \
        --cache-to type=local,dest=/tmp/.buildx-cache,mode=max \
        --tag ${REGISTRY}/takingnote-frontend:${TAG} \
        --tag ${REGISTRY}/takingnote-frontend:latest \
        --file Dockerfile \
        .
    
    cd ../..
    echo -e "${GREEN}Frontend build complete!${NC}"
}

# Push function
push_images() {
    echo -e "${YELLOW}Pushing images to registry...${NC}"
    
    if [ "$SERVICE" = "backend" ] || [ "$SERVICE" = "both" ]; then
        docker push ${REGISTRY}/takingnote-backend:${TAG}
        docker push ${REGISTRY}/takingnote-backend:latest
        echo -e "${GREEN}Backend images pushed!${NC}"
    fi
    
    if [ "$SERVICE" = "frontend" ] || [ "$SERVICE" = "both" ]; then
        docker push ${REGISTRY}/takingnote-frontend:${TAG}
        docker push ${REGISTRY}/takingnote-frontend:latest
        echo -e "${GREEN}Frontend images pushed!${NC}"
    fi
}

# Main build logic
case "$SERVICE" in
    backend)
        build_backend
        ;;
    frontend)
        build_frontend
        ;;
    both)
        echo -e "${YELLOW}Building both backend and frontend...${NC}"
        build_backend
        build_frontend
        echo -e "${GREEN}All images built successfully!${NC}"
        ;;
    *)
        echo -e "${RED}Invalid service: $SERVICE. Use 'backend', 'frontend', or 'both'${NC}"
        exit 1
        ;;
esac

# Ask to push
read -p "Push images to registry? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    push_images
    echo -e "${GREEN}✓ All done!${NC}"
else
    echo -e "${YELLOW}Skipped push. Images are ready locally.${NC}"
fi

