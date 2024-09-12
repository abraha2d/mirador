```
mir·a·dor    /ˈmirədôr/

noun    a turret or tower attached to a building and providing an extensive view.
```

## System requirements
- CPU: 2 cores, plus 1 core per H.265 camera
- GPU:
  - CUDA support if any cameras are detection-enabled
  - H.264 NVENC if any cameras are visualization-enabled
  - 2GB VRAM per detection-enabled camera
  - 512MB VRAM per H.265 camera
- Memory: 4GB, plus 4GB per detection-enabled camera
- Storage: 32GB (not including recordings)

## Install dependencies
```shell
sudo apt-get install build-essential

deploy/scripts/setup.sh
deploy/scripts/build.sh
deploy/scripts/install.sh
```

## Run (production)
```shell
systemctl start mirador
systemctl start mhousekeep
systemctl start mproxy

# For each configured camera
systemctl start mworker@${CAMERA_ID}
```

## Run backend (development)
```shell
. deploy/envs/_base/bin/activate
./manage.py runserver
```

## Run frontend (development)
```shell
. deploy/envs/_base/bin/activate
cd ui/ && yarn start
```
