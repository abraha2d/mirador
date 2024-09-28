#!/bin/bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")
DEPLOY_ROOT=$(dirname "$DEPLOY_SCRIPTS")

"$DEPLOY_SCRIPTS/setup_conda.sh"
"$DEPLOY_SCRIPTS/setup_node.sh"
"$DEPLOY_SCRIPTS/setup_migrations.sh"
