#!/bin/bash

# Hello FHEVM Tutorial Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Hello FHEVM Tutorial Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration:"
    echo "   - Add your private key (testnet only!)"
    echo "   - Update contract address after deployment"
else
    echo "✅ .env file already exists"
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
npm run compile

# Run tests
echo "🧪 Running tests..."
npm run test

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Get testnet tokens from: https://faucet.zama.ai/"
echo "3. Deploy contracts: npm run deploy:testnet"
echo "4. Start frontend: npm run dev"
echo ""
echo "Happy coding with FHEVM! 🚀"
