.PHONY: dev example docs-dev docs-build build install clean test lint

# Development
dev:
	npm run dev

example:
	npm run example

# Documentation
docs-dev:
	npm run docs:dev

docs-build:
	npm run docs:build

# Library
build:
	npm run build

# Setup
install:
	npm install

# Testing and Quality
test:
	npm test

lint:
	npm run lint

# Cleanup
clean:
	rm -rf dist
	rm -rf node_modules
	rm -rf docs/build
	rm -rf coverage

# Help
help:
	@echo "Available targets:"
	@echo "  dev        - Start development server"
	@echo "  example    - Start example app to test the component"
	@echo "  docs-dev   - Start documentation development server"
	@echo "  docs-build - Build documentation"
	@echo "  build      - Build library"
	@echo "  install    - Install dependencies"
	@echo "  test       - Run tests"
	@echo "  lint       - Lint code"
	@echo "  clean      - Clean build artifacts"
	@echo "  help       - Show this help message"