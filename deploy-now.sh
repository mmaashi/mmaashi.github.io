#!/usr/bin/env bash
set -e

echo "🚀 SŪQAI — Deploy to Vercel"
echo "─────────────────────────────"

cd "$(dirname "$0")"

# Stage all changes
git add -A

# Commit with timestamp
MSG="Quality Sprint: i18n, display-names, about page — $(date '+%Y-%m-%d %H:%M')"
git commit -m "$MSG" || { echo "ℹ️  Nothing to commit"; }

# Push to trigger Vercel deploy
git push

echo ""
echo "✅ Pushed. Vercel will deploy automatically."
echo "   https://suqaist.vercel.app"
