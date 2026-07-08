#!/bin/bash

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"

echo "# -----------"
echo "# Installing root npm dependencies (npm install)"
echo "# -----------"
(cd "$repo_root" && npm install)

# Install dev dependencies
echo ""
echo "# -----------"
echo "# Installing dev dependencies (npm install)"
echo "# -----------"
(cd "$repo_root/dev" && npm install)

echo ""
echo "# Setup complete.  Run \"npm run dev\" from the repo root"
echo "# -----------"
echo ""

