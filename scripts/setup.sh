#!/bin/bash

# Exit on any error
set -e

echo "Setting up Habit Tracker v0..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npm run prisma:generate

# Run database migrations
echo "Running database migrations..."
npm run prisma:migrate

# Seed the database
echo "Seeding the database..."
npm run prisma:seed

echo "Setup complete! You can now start the development server with 'npm run dev'"