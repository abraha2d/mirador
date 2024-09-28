#!/usr/bin/env bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")
DEPLOY_ROOT=$(dirname "$DEPLOY_SCRIPTS")

. "$DEPLOY_SCRIPTS/_utils.sh"
source "$(get_base_env)/bin/activate"

cp -a "$DEPLOY_ROOT/conda/.condarc" "$(get_base_env)"
mamba env update -f "$DEPLOY_ROOT/conda/environment.yml"

if [ ! -x "$(get_base_env)/bin/bun" ]; then
  curl -fsSL https://bun.sh/install | BUN_INSTALL=$(get_base_env) bash
fi
