#!/usr/bin/env bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")

"$DEPLOY_SCRIPTS/setup_envs.sh"
"$DEPLOY_SCRIPTS/setup_migrations.sh"
"$DEPLOY_SCRIPTS/setup_node_modules.sh"
