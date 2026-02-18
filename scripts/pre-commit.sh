#!/bin/bash
# Pre-commit hook for biopreparedness-map
# Catches issues that would break the Cloudflare Pages build or produce bad data.

set -e
REPO_ROOT=$(git rev-parse --show-toplevel)
FAIL=0

# ── 1. Block symlinks ────────────────────────────────────────────────────────
# CF Pages fails with "links to files that can't be accessed" if symlinks are staged.
SYMLINKS=$(git diff --cached --name-only | while read f; do
  if [ -L "$REPO_ROOT/$f" ]; then echo "$f"; fi
done)

if [ -n "$SYMLINKS" ]; then
  echo ""
  echo "❌ Pre-commit: symlink(s) staged for commit — Cloudflare Pages will fail:"
  echo "$SYMLINKS" | sed 's/^/   /'
  echo "   Remove them: git rm --cached <file>"
  FAIL=1
fi

# ── 2. Run validate.js if data.json is staged ────────────────────────────────
if git diff --cached --name-only | grep -q "^data\.json$"; then
  echo "🔍 data.json changed — running validate.js..."
  if ! node "$REPO_ROOT/validate.js"; then
    echo ""
    echo "❌ Pre-commit: validate.js failed. Fix errors above before committing."
    FAIL=1
  fi
fi

# ── 3. Warn if .gitignore loses .claude/ ────────────────────────────────────
if git diff --cached --name-only | grep -q "^\.gitignore$"; then
  if ! git show :".gitignore" 2>/dev/null | grep -q "^\.claude"; then
    echo ""
    echo "⚠️  Pre-commit: .gitignore no longer excludes .claude/ — this will break CF Pages builds."
    FAIL=1
  fi
fi

[ $FAIL -eq 0 ] && exit 0 || exit 1
