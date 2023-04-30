```
mir·a·dor    /ˈmirədôr/

noun    a turret or tower attached to a building and providing an extensive view.
```

## System requirements
- 4GB memory
- 20GB storage

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
