#!/bin/bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")
DEPLOY_ROOT=$(dirname "$DEPLOY_SCRIPTS")

. "$DEPLOY_SCRIPTS/_utils.sh"
source "$(get_base_env)/bin/activate"

cp -a "$DEPLOY_ROOT/conda/.condarc" "$(get_base_env)"
mamba env update -f "$DEPLOY_ROOT/conda/environment.yml"

(cd ui && yarn)

sudo cp -a "$DEPLOY_ROOT/systemd"/* /etc/systemd/system/
sudo systemctl daemon-reload

