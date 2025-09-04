#!/bin/bash

# Development Setup Script for Smart Shift Tracker Multi-Tenant SaaS
# This script sets up the local development environment

set -e

echo "🚀 Setting up Smart Shift Tracker Multi-Tenant SaaS..."

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "📋 Checking required tools..."
check_tool "node"
check_tool "npm"
check_tool "supabase"

# Check Node.js version
NODE_VERSION=$(node -v | cut -c2-)
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $REQUIRED_VERSION or higher is required. You have $NODE_VERSION"
    exit 1
fi

echo "✅ All required tools are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

# Start Supabase local development (if supabase is configured)
if [ -f supabase/config.toml ]; then
    echo "🗄️  Starting Supabase local development..."
    supabase start
    
    echo "🔄 Running migrations..."
    supabase db reset
    
    echo "📊 Seeding demo data..."
    if [ -f scripts/seed-demo-data.sql ]; then
        supabase db seed --db-url $(supabase status | grep "DB URL" | awk '{print $3}') --file scripts/seed-demo-data.sql
    fi
else
    echo "⚠️  Supabase not configured locally. Using remote instance."
fi

# Run the development server
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:5173 in your browser"
echo ""
echo "For testing multi-tenancy:"
echo "- Default tenant 'default-org' will be created on first user signup"
echo "- Create additional tenants through the admin interface"
echo ""

# Check if we should start the dev server
read -p "Start development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev
fi