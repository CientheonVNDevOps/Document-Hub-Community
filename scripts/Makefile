# Makefile for Document Community Hub Docker Builds

.PHONY: help build push clean test quick-build backend frontend

# Default values
REGISTRY ?= docker.io
USERNAME ?= lykny97
TAG ?= latest
PLATFORMS ?= linux/amd64,linux/arm64

# Colors
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[1;33m
NC = \033[0m

help: ## Show this help message
	@echo "Document Community Hub - Docker Build Commands"
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Variables:"
	@echo "  REGISTRY=$(REGISTRY)"
	@echo "  USERNAME=$(USERNAME)"
	@echo "  TAG=$(TAG)"
	@echo "  PLATFORMS=$(PLATFORMS)"
	@echo ""
	@echo "Examples:"
	@echo "  make build                    # Build both images"
	@echo "  make build TAG=v1.0.0         # Build with specific tag"
	@echo "  make backend                  # Build only backend"
	@echo "  make quick-build              # Quick build and push"

build: ## Build both backend and frontend images
	@echo "$(BLUE)[INFO]$(NC) Building both images..."
	./scripts/build-and-push.sh --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG) --platform $(PLATFORMS)

push: ## Push images to registry
	@echo "$(BLUE)[INFO]$(NC) Pushing images..."
	./scripts/build-and-push.sh --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG) --platform $(PLATFORMS)

backend: ## Build only backend image
	@echo "$(BLUE)[INFO]$(NC) Building backend image..."
	./scripts/build-and-push.sh --backend-only --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG) --platform $(PLATFORMS)

frontend: ## Build only frontend image
	@echo "$(BLUE)[INFO]$(NC) Building frontend image..."
	./scripts/build-and-push.sh --frontend-only --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG) --platform $(PLATFORMS)

quick-build: ## Quick build and push (simplified)
	@echo "$(BLUE)[INFO]$(NC) Quick build and push..."
	./scripts/quick-build.sh --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG) --platform $(PLATFORMS)

build-no-cache: ## Build without cache
	@echo "$(BLUE)[INFO]$(NC) Building without cache..."
	./scripts/build-and-push.sh --no-cache --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG) --platform $(PLATFORMS)

build-local: ## Build images locally (don't push)
	@echo "$(BLUE)[INFO]$(NC) Building images locally..."
	./scripts/build-and-push.sh --no-push --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG) --platform $(PLATFORMS)

amd64: ## Build only for AMD64 platform
	@echo "$(BLUE)[INFO]$(NC) Building for AMD64 platform..."
	./scripts/build-and-push.sh --platform linux/amd64 --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG)

arm64: ## Build only for ARM64 platform
	@echo "$(BLUE)[INFO]$(NC) Building for ARM64 platform..."
	./scripts/build-and-push.sh --platform linux/arm64 --registry $(REGISTRY) --username $(USERNAME) --tag $(TAG)

clean: ## Clean up Docker resources
	@echo "$(BLUE)[INFO]$(NC) Cleaning up Docker resources..."
	docker system prune -f
	docker buildx prune -f

test: ## Test build scripts
	@echo "$(BLUE)[INFO]$(NC) Testing build scripts..."
	./scripts/build-and-push.sh --help
	./scripts/quick-build.sh --help
	@echo "$(GREEN)[SUCCESS]$(NC) All scripts are working correctly!"

# Development commands
dev-backend: ## Start backend in development mode
	@echo "$(BLUE)[INFO]$(NC) Starting backend development server..."
	cd apps/backend && bun run start:dev

dev-frontend: ## Start frontend in development mode
	@echo "$(BLUE)[INFO]$(NC) Starting frontend development server..."
	cd apps/frontend && bun run dev

dev: ## Start both backend and frontend in development mode
	@echo "$(BLUE)[INFO]$(NC) Starting development environment..."
	@echo "$(YELLOW)[WARNING]$(NC) This will start both services. Use Ctrl+C to stop."
	@trap 'kill %1 %2' INT; \
	cd apps/backend && bun run start:dev & \
	cd apps/frontend && bun run dev & \
	wait

# Docker Compose commands
compose-build: ## Build using Docker Compose
	@echo "$(BLUE)[INFO]$(NC) Building with Docker Compose..."
	docker-compose -f docker-compose.build.yml build

compose-push: ## Push using Docker Compose
	@echo "$(BLUE)[INFO]$(NC) Pushing with Docker Compose..."
	docker-compose -f docker-compose.build.yml push

# Registry specific commands
dockerhub: ## Build and push to Docker Hub
	@echo "$(BLUE)[INFO]$(NC) Building and pushing to Docker Hub..."
	./scripts/quick-build.sh --registry docker.io --username $(USERNAME) --tag $(TAG)

ghcr: ## Build and push to GitHub Container Registry
	@echo "$(BLUE)[INFO]$(NC) Building and pushing to GitHub Container Registry..."
	./scripts/quick-build.sh --registry ghcr.io --username $(USERNAME) --tag $(TAG)

# Version management
version: ## Show current version information
	@echo "$(BLUE)[INFO]$(NC) Version Information:"
	@echo "  Registry: $(REGISTRY)"
	@echo "  Username: $(USERNAME)"
	@echo "  Tag: $(TAG)"
	@echo "  Platforms: $(PLATFORMS)"
	@echo "  Backend Image: $(REGISTRY)/$(USERNAME)/takingnote-backend:$(TAG)"
	@echo "  Frontend Image: $(REGISTRY)/$(USERNAME)/takingnote-frontend:$(TAG)"

# Default target
.DEFAULT_GOAL := help
