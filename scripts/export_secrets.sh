#!/bin/bash
# export_secrets.sh - Helper to export local auth to GitHub Secrets
# ===============================================================

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$PROJECT_DIR" || exit 1

echo "------------------------------------------------------------"
echo "🔐 SUPRAWALL CLOUD SECURITY EXPORTER"
echo "------------------------------------------------------------"
echo "Follow these steps to migrate your Fleet to the Cloud:"
echo "1. Go to your GitHub Repo -> Settings -> Secrets and variables -> Actions"
echo "2. Add the following New Repository Secrets:"
echo ""

echo "--- [ ENV_CONTENT ] ---"
cat .env
echo ""

echo "--- [ LINKEDIN_AUTH_JSON ] ---"
cat assets/auth/linkedin_auth.json
echo ""

echo "--- [ X_AUTH_JSON ] ---"
cat assets/auth/x_auth.json
echo ""

echo "------------------------------------------------------------"
echo "✅ Export Complete. Your fleet is ready for the cloud."
