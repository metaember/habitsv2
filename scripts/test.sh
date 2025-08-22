#!/bin/bash

# Exit on any error
set -e

echo "Running Habit Tracker tests..."

# Run TypeScript type checking
echo "Checking TypeScript types..."
npm run typecheck

# Run ESLint
echo "Running ESLint..."
npm run lint

# Run unit tests
echo "Running unit tests..."
npm test

echo "All tests passed!"