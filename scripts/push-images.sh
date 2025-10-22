#!/bin/bash

# Script to tag and push Docker images to various registries
# Usage: ./scripts/push-images.sh [registry] [username] [tag]

set -e

REGISTRY=${1:-"docker.io"}
USERNAME=${2:-"your-username"}
TAG=${3:-"latest"}

echo "Pushing images to $REGISTRY/$USERNAME with tag $TAG"

# Tag backend image
echo "Tagging backend image..."
docker tag takingnote-backend:latest $REGISTRY/$USERNAME/takingnote-backend:$TAG

# Tag frontend image
echo "Tagging frontend image..."
docker tag takingnote-frontend:latest $REGISTRY/$USERNAME/takingnote-frontend:$TAG

# Push backend image
echo "Pushing backend image..."
docker push $REGISTRY/$USERNAME/takingnote-backend:$TAG

# Push frontend image
echo "Pushing frontend image..."
docker push $REGISTRY/$USERNAME/takingnote-frontend:$TAG

echo "Successfully pushed both images to $REGISTRY/$USERNAME"
echo "Backend: $REGISTRY/$USERNAME/takingnote-backend:$TAG"
echo "Frontend: $REGISTRY/$USERNAME/takingnote-frontend:$TAG"
