#!/bin/bash

DEPLOY_SCRIPTS=$(dirname "${BASH_SOURCE[0]}")
DEPLOY_ROOT=$(dirname "$DEPLOY_SCRIPTS")

source() {
  local f="$1"
  shift
  builtin source "${f}" "${@}"
}

cache_download() {
  mkdir -p "$DEPLOY_ROOT/_cache"
  if [[ ! -f "$DEPLOY_ROOT/_cache/$2" ]]; then
    curl -L "$1" -o "$DEPLOY_ROOT/_cache/$2"
  else
    echo "[_cache] Found $2" 1>&2
  fi
  echo "$DEPLOY_ROOT/_cache/$2"
}

MF_FILE="Mambaforge-$(uname)-$(uname -m).sh"
MF_URL="https://github.com/conda-forge/miniforge/releases/latest/download/$MF_FILE"

get_base_env() {
  base_env="/opt/mf"
  if [ ! -d "$base_env" ]; then
    base_env="$DEPLOY_ROOT/envs/_base"
  fi

  if [[ ! -f "$base_env/bin/activate" ]]; then
    echo "Downloading Mambaforge..." 1>&2
    mf_installer=$(cache_download "$MF_URL" "$MF_FILE")

    echo "Installing Mambaforge..." 1>&2
    bash "$mf_installer" -bfp "$base_env" 1>&2
  fi

  echo "$base_env"
}

