#!/bin/bash

# ========================================
# Auto Commit and Push Script
# ========================================
#
# This script automatically commits and pushes changes to GitHub
# using the author information from .env file.
#
# Usage:
#   ./scripts/git-commit.sh "Your commit message"
#
# Or simply:
#   ./scripts/git-commit.sh
#   (will prompt for commit message)
#
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env
if [ -f .env ]; then
    # Safely load environment variables
    export $(grep -v '^#' .env | grep -E '^(GITHUB_USERNAME|GITHUB_EMAIL|EMAIL)=' | xargs)
    echo -e "${GREEN}✓${NC} Loaded .env file"
else
    echo -e "${RED}✗${NC} .env file not found!"
    exit 1
fi

# Configure Git author from .env
if [ -n "$GITHUB_USERNAME" ] && [ -n "$GITHUB_EMAIL" ]; then
    git config user.name "$GITHUB_USERNAME"
    git config user.email "$GITHUB_EMAIL"
    echo -e "${GREEN}✓${NC} Git author configured: $GITHUB_USERNAME <$GITHUB_EMAIL>"
else
    echo -e "${RED}✗${NC} GITHUB_USERNAME or GITHUB_EMAIL not found in .env!"
    exit 1
fi

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}ℹ${NC} No changes to commit"
    exit 0
fi

# Show current status
echo ""
echo -e "${BLUE}📊 Current changes:${NC}"
git status --short
echo ""

# Get commit message
if [ -z "$1" ]; then
    echo -e "${BLUE}💬 Enter commit message:${NC}"
    read -p "> " COMMIT_MESSAGE

    if [ -z "$COMMIT_MESSAGE" ]; then
        echo -e "${RED}✗${NC} Commit message cannot be empty!"
        exit 1
    fi
else
    COMMIT_MESSAGE="$1"
fi

# Stage all changes
echo ""
echo -e "${BLUE}📦 Staging all changes...${NC}"
git add -A
echo -e "${GREEN}✓${NC} All changes staged"

# Commit changes
echo ""
echo -e "${BLUE}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

echo -e "${GREEN}✓${NC} Changes committed successfully"

# Push to GitHub
echo ""
echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
if git push origin main; then
    echo -e "${GREEN}✓${NC} Successfully pushed to GitHub!"
    echo ""
    echo -e "${GREEN}🎉 All done!${NC}"
    echo ""
    echo -e "${BLUE}📍 View on GitHub:${NC}"

    # Extract repository URL
    REPO_URL=$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')
    echo "   https://github.com/$REPO_URL"
else
    echo -e "${RED}✗${NC} Failed to push to GitHub"
    echo ""
    echo -e "${YELLOW}Tip:${NC} Try running: git push origin main --force"
    exit 1
fi
