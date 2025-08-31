#!/bin/bash

# GitHub Actions + Vercel Setup Script
# This script helps you set up automated deployment

set -e

echo "🚀 Setting up GitHub Actions + Vercel Deployment"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the backend directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Prerequisites Check${NC}"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your actual values${NC}"
fi

echo -e "${BLUE}🔧 Installation Steps${NC}"
echo "=================================================="

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo -e "${GREEN}✅ Installation complete!${NC}"

echo -e "${BLUE}📝 Next Steps${NC}"
echo "=================================================="
echo "1. Create a Vercel project:"
echo "   npm install -g vercel"
echo "   vercel login"
echo "   vercel"
echo ""
echo "2. Get your Vercel configuration:"
echo "   vercel project ls"
echo "   vercel whoami"
echo ""
echo "3. Create a Vercel token:"
echo "   Go to https://vercel.com/account/tokens"
echo ""
echo "4. Set up GitHub secrets:"
echo "   Go to your GitHub repo → Settings → Secrets and variables → Actions"
echo "   Add these secrets:"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_ORG_ID"
echo "   - VERCEL_PROJECT_ID"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - VERCEL_URL"
echo ""
echo "5. Configure Vercel environment variables:"
echo "   Go to Vercel dashboard → Your project → Settings → Environment Variables"
echo ""
echo "6. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add GitHub Actions workflows'"
echo "   git push origin main"
echo ""
echo -e "${GREEN}🎉 Setup complete! Check GITHUB_ACTIONS_SETUP.md for detailed instructions.${NC}"
