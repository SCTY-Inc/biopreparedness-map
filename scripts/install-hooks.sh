#!/bin/bash
# Run once after cloning: bash scripts/install-hooks.sh
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "✓ Pre-commit hook installed"
