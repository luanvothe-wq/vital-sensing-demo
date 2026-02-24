#!/bin/bash
# Analyze staged changes for commit message generation
# Usage: ./analyze-changes.sh

echo "=== STAGED FILES ==="
git diff --cached --name-status

echo ""
echo "=== CHANGE STATISTICS ==="
git diff --cached --stat

echo ""
echo "=== FILE CATEGORIES ==="
git diff --cached --name-only | while read file; do
    case "$file" in
        *.md|*.txt|*.rst|docs/*|README*)
            echo "docs: $file"
            ;;
        *.test.*|*.spec.*|*_test.*|test/*|tests/*|__tests__/*)
            echo "test: $file"
            ;;
        *.json|*.yaml|*.yml|*.toml|*.ini|*.env*|.*)
            echo "config: $file"
            ;;
        *.png|*.jpg|*.svg|*.ico|*.gif|assets/*|images/*)
            echo "asset: $file"
            ;;
        *)
            echo "code: $file"
            ;;
    esac
done
