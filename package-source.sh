#!/bin/bash

# Script to package source code for Firefox extension review
# Uses git archive to create a clean source package

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ZIP_FILE="$SCRIPT_DIR/source-package.zip"

cd "$SCRIPT_DIR"

# Clean up any previous build
rm -f "$ZIP_FILE"

# Create the zip using git archive
# Files excluded via .gitattributes with export-ignore, plus .github/ which
# must stay in GitHub's repository archives for `$/` action references
git archive --format=zip -o "$ZIP_FILE" HEAD -- . ":(exclude).github"

echo "Source package created: $ZIP_FILE"
echo "Contents:"
unzip -l "$ZIP_FILE"
