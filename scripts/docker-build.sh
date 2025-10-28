#!/bin/bash
# Docker build script optimized for macOS and Coolify deployment
# Usage: ./scripts/docker-build.sh [OPTIONS]
#
# Options:
#   --service NAME      Service to build (backend|frontend|both) [default: both]
#   --registry URL      Docker registry URL [default: docker.io]
#   --username NAME     Docker registry username [default: lykny97]
#   --tag TAG          Image tag [default: latest]
#   --platform PLAT    Target platform [default: linux/amd64]
#   --no-cache         Build without using cache
#   --push             Automatically push images after building
#   --skip-push        Build but don't push (skip prompt)
#   --help             Show this help message

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SERVICE="both"
REGISTRY="docker.io"
USERNAME="lykny97"
TAG="latest"
PLATFORM="linux/amd64"
NO_CACHE=""
PUSH=""
SKIP_PUSH=""

# Enable BuildKit for better caching and performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --service)
            SERVICE="$2"
            shift 2
            ;;
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
            PLATFORM="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --push)
            PUSH="yes"
            shift
            ;;
        --skip-push)
            SKIP_PUSH="yes"
            shift
            ;;
        --help)
            echo "Usage: ./scripts/docker-build.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --service NAME      Service to build (backend|frontend|both) [default: both]"
            echo "  --registry URL      Docker registry URL [default: docker.io]"
            echo "  --username NAME     Docker registry username [default: lykny97]"
            echo "  --tag TAG          Image tag [default: latest]"
            echo "  --platform PLAT    Target platform [default: linux/amd64]"
            echo "  --no-cache         Build without using cache"
            echo "  --push             Automatically push images after building"
            echo "  --skip-push        Build but don't push (skip prompt)"
            echo "  --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/docker-build.sh --service frontend --push"
            echo "  ./scripts/docker-build.sh --tag v1.0.0 --no-cache"
            echo "  ./scripts/docker-build.sh --service backend --registry ghcr.io"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Construct image names
BACKEND_IMAGE="${REGISTRY}/${USERNAME}/takingnote-backend"
FRONTEND_IMAGE="${REGISTRY}/${USERNAME}/takingnote-frontend"

# Build function for backend
build_backend() {
    echo -e "${BLUE}[INFO]${NC} Building backend Docker image..."
    echo -e "${YELLOW}  Image: ${BACKEND_IMAGE}:${TAG}${NC}"
    echo -e "${YELLOW}  Platform: ${PLATFORM}${NC}"
    
    cd apps/backend
    
    # Build with BuildKit optimizations
    docker buildx build \
        --platform ${PLATFORM} \
        --cache-from type=local,src=/tmp/.buildx-cache \
        --cache-to type=local,dest=/tmp/.buildx-cache,mode=max \
        ${NO_CACHE} \
        --tag ${BACKEND_IMAGE}:${TAG} \
        --tag ${BACKEND_IMAGE}:latest \
        --file Dockerfile \
        --progress=plain \
        .
    
    cd ../..
    echo -e "${GREEN}[SUCCESS]${NC} Backend build complete!"
}

# Build function for frontend
build_frontend() {
    echo -e "${BLUE}[INFO]${NC} Building frontend Docker image..."
    echo -e "${YELLOW}  Image: ${FRONTEND_IMAGE}:${TAG}${NC}"
    echo -e "${YELLOW}  Platform: ${PLATFORM}${NC}"
    
    cd apps/frontend
    
    # Build with BuildKit optimizations
    docker buildx build \
        --platform ${PLATFORM} \
        --cache-from type=local,src=/tmp/.buildx-cache \
        --cache-to type=local,dest=/tmp/.buildx-cache,mode=max \
        ${NO_CACHE} \
        --tag ${FRONTEND_IMAGE}:${TAG} \
        --tag ${FRONTEND_IMAGE}:latest \
        --file Dockerfile \
        --progress=plain \
        .
    
    cd ../..
    echo -e "${GREEN}[SUCCESS]${NC} Frontend build complete!"
}

# Push function
push_images() {
    echo -e "${YELLOW}[INFO]${NC} Pushing images to registry..."
    
    if [ "$SERVICE" = "backend" ] || [ "$SERVICE" = "both" ]; then
        echo -e "${BLUE}Pushing ${BACKEND_IMAGE}:${TAG}...${NC}"
        docker push ${BACKEND_IMAGE}:${TAG}
        docker push ${BACKEND_IMAGE}:latest
        echo -e "${GREEN}[SUCCESS]${NC} Backend images pushed!"
    fi
    
    if [ "$SERVICE" = "frontend" ] || [ "$SERVICE" = "both" ]; then
        echo -e "${BLUE}Pushing ${FRONTEND_IMAGE}:${TAG}...${NC}"
        docker push ${FRONTEND_IMAGE}:${TAG}
        docker push ${FRONTEND_IMAGE}:latest
        echo -e "${GREEN}[SUCCESS]${NC} Frontend images pushed!"
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} All images pushed successfully!"
}

# Display build configuration
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Docker Build Configuration${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Registry:  ${YELLOW}${REGISTRY}${NC}"
echo -e "Username:  ${YELLOW}${USERNAME}${NC}"
echo -e "Tag:       ${YELLOW}${TAG}${NC}"
echo -e "Platform:  ${YELLOW}${PLATFORM}${NC}"
echo -e "Service:   ${YELLOW}${SERVICE}${NC}"
if [ -n "$NO_CACHE" ]; then
    echo -e "Cache:     ${YELLOW}Disabled${NC}"
fi
echo -e "${BLUE}========================================${NC}"
echo ""

# Main build logic
case "$SERVICE" in
    backend)
        build_backend
        ;;
    frontend)
        build_frontend
        ;;
    both)
        echo -e "${YELLOW}[INFO]${NC} Building both backend and frontend..."
        build_backend
        build_frontend
        echo -e "${GREEN}[SUCCESS]${NC} All images built successfully!"
        ;;
    *)
        echo -e "${RED}[ERROR]${NC} Invalid service: $SERVICE. Use 'backend', 'frontend', or 'both'${NC}"
        exit 1
        ;;
esac

# Push logic
if [ -n "$SKIP_PUSH" ]; then
    echo -e "${YELLOW}[INFO]${NC} Skipping push (--skip-push flag used)"
elif [ -n "$PUSH" ]; then
    echo -e "${BLUE}[INFO]${NC} Pushing images (--push flag used)..."
    push_images
    echo -e "${GREEN}[SUCCESS]${NC} ✓ All done!"
else
    read -p "$(echo -e ${YELLOW}Push images to registry? ${NC}[y/N]) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_images
        echo -e "${GREEN}[SUCCESS]${NC} ✓ All done!"
    else
        echo -e "${YELLOW}[INFO]${NC} Skipped push. Images are ready locally."
    fi
fi

