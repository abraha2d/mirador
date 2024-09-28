#!/usr/bin/env bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")
DEPLOY_ROOT=$(dirname "$DEPLOY_SCRIPTS")
PROJECT_ROOT=$(dirname "$DEPLOY_ROOT")

. "$DEPLOY_SCRIPTS/_utils.sh"
source "$(get_base_env)/bin/activate"

python "$PROJECT_ROOT/manage.py" migrate
