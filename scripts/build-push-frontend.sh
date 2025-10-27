#!/bin/bash
# Script to build and push frontend image

set -e

echo "Building frontend Docker image..."
cd apps/frontend

# Build the image
docker buildx build \
  --platform linux/amd64 \
  -t docker.io/lykny97/takingnote-frontend:latest \
  -t docker.io/lykny97/takingnote-frontend:$(date +%Y%m%d-%H%M%S) \
  .

echo "Pushing frontend image..."
docker push docker.io/lykny97/takingnote-frontend:latest

echo "Frontend image built and pushed successfully!"

