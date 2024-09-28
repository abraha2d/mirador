#!/usr/bin/env bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")

"$DEPLOY_SCRIPTS/lint_biome.sh"
"$DEPLOY_SCRIPTS/lint_ruff.sh"
