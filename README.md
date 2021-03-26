```
mir·a·dor    /ˈmirədôr/

noun    a turret or tower attached to a building and providing an extensive view.
```

## System requirements
- Ubuntu 20.04 LXC
- 2GB RAM
- 4GB SSD

## Install dependencies
Assuming an clean Ubuntu 20.04 LXC:
```shell
sudo apt-get install build-essential curl ffmpeg git python3-dev python3-venv
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install nodejs yarn
python3 -m venv .venv
. .venv/bin/activate
pip install wheel
pip install -r requirements.txt
cd ui/ && yarn
```

## Run backend (development)
```shell
. .venv/bin/activate
./manage.py runserver 0.0.0.0:80
```

## Run frontend (development)
```shell
cd ui/ && yarn start
```