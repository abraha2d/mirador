#!/usr/bin/env bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")
DEPLOY_ROOT=$(dirname "$DEPLOY_SCRIPTS")

sudo cp -a "$DEPLOY_ROOT/systemd"/* /etc/systemd/system/
sudo systemctl daemon-reload
