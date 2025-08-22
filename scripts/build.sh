#!/bin/bash

# Exit on any error
set -e

echo "Building Habit Tracker v0..."

# Generate Prisma client
echo "Generating Prisma client..."
npm run prisma:generate

# Run TypeScript type checking
echo "Checking TypeScript types..."
npm run typecheck

# Run ESLint
echo "Running ESLint..."
npm run lint

# Run unit tests
echo "Running unit tests..."
npm test

# Build the application
echo "Building the application..."
npm run build

echo "Build complete!"