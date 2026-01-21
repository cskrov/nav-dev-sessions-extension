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
# Files excluded via .gitattributes with export-ignore
git archive --format=zip --prefix=source-package/ -o "$ZIP_FILE" HEAD

echo "Source package created: $ZIP_FILE"
echo "Contents:"
unzip -l "$ZIP_FILE"
