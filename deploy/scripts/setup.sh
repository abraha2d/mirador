#!/bin/bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")
DEPLOY_ROOT=$(dirname "$DEPLOY_SCRIPTS")
PROJECT_ROOT=$(dirname "$DEPLOY_ROOT")

. "$DEPLOY_SCRIPTS/_utils.sh"
source "$(get_base_env)/bin/activate"

cp -a "$DEPLOY_ROOT/conda/.condarc" "$(get_base_env)"
mamba env update -f "$DEPLOY_ROOT/conda/environment.yml"

python "$PROJECT_ROOT/manage.py" migrate

(cd "$PROJECT_ROOT/ui" && yarn)

