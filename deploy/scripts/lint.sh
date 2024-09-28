#!/bin/bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")
DEPLOY_ROOT=$(dirname "$DEPLOY_SCRIPTS")

"$DEPLOY_SCRIPTS/lint_biome.sh"
"$DEPLOY_SCRIPTS/lint_ruff.sh"
