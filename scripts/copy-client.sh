#!/bin/bash
# Create dist/client folder if it doesn't exist
mkdir -p dist/client
mkdir -p dist/client/css
mkdir -p dist/client/js
mkdir -p dist/client/pages

# Copy HTML files
cp -r src/client/*.html dist/client/ 2>/dev/null
cp -r src/client/css/* dist/client/css/ 2>/dev/null
cp -r src/client/js/* dist/client/js/ 2>/dev/null
cp -r src/client/pages/* dist/client/pages/ 2>/dev/null

echo "✅ Client files copied to dist/client/"
