#!/bin/bash

# Comprehensive deployment script for TakingNote Community Cientheon
# Usage: ./scripts/deploy.sh [action] [options]

set -e

ACTION=${1:-"help"}
REGISTRY=${2:-"docker.io"}
USERNAME=${3:-"your-username"}
TAG=${4:-"latest"}

case $ACTION in
  "build")
    echo "Building Docker images..."
    docker build -t takingnote-backend:latest ./apps/backend
    docker build -t takingnote-frontend:latest ./apps/frontend
    echo "Build completed successfully!"
    ;;
  "tag")
    echo "Tagging images for registry $REGISTRY/$USERNAME..."
    docker tag takingnote-backend:latest $REGISTRY/$USERNAME/takingnote-backend:$TAG
    docker tag takingnote-frontend:latest $REGISTRY/$USERNAME/takingnote-frontend:$TAG
    echo "Tagging completed!"
    ;;
  "push")
    echo "Pushing images to $REGISTRY/$USERNAME..."
    docker push $REGISTRY/$USERNAME/takingnote-backend:$TAG
    docker push $REGISTRY/$USERNAME/takingnote-frontend:$TAG
    echo "Push completed!"
    ;;
  "deploy")
    echo "Full deployment process..."
    echo "1. Building images..."
    docker build -t takingnote-backend:latest ./apps/backend
    docker build -t takingnote-frontend:latest ./apps/frontend
    
    echo "2. Tagging images..."
    docker tag takingnote-backend:latest $REGISTRY/$USERNAME/takingnote-backend:$TAG
    docker tag takingnote-frontend:latest $REGISTRY/$USERNAME/takingnote-frontend:$TAG
    
    echo "3. Pushing images..."
    docker push $REGISTRY/$USERNAME/takingnote-backend:$TAG
    docker push $REGISTRY/$USERNAME/takingnote-frontend:$TAG
    
    echo "Deployment completed successfully!"
    echo "Images available at:"
    echo "  Backend: $REGISTRY/$USERNAME/takingnote-backend:$TAG"
    echo "  Frontend: $REGISTRY/$USERNAME/takingnote-frontend:$TAG"
    ;;
  "local")
    echo "Starting local development environment..."
    docker-compose up -d
    echo "Local environment started!"
    echo "Backend: http://localhost:3000"
    echo "Frontend: http://localhost:80"
    ;;
  "stop")
    echo "Stopping local environment..."
    docker-compose down
    echo "Local environment stopped!"
    ;;
  "clean")
    echo "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    echo "Cleanup completed!"
    ;;
  "help"|*)
    echo "TakingNote Community Cientheon Deployment Script"
    echo ""
    echo "Usage: $0 [action] [registry] [username] [tag]"
    echo ""
    echo "Actions:"
    echo "  build     - Build Docker images"
    echo "  tag       - Tag images for registry"
    echo "  push      - Push images to registry"
    echo "  deploy    - Full deployment (build + tag + push)"
    echo "  local     - Start local development environment"
    echo "  stop      - Stop local environment"
    echo "  clean     - Clean up Docker resources"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 deploy docker.io myusername v1.0.0"
    echo "  $0 local"
    echo "  $0 push ghcr.io myusername latest"
    ;;
esac
