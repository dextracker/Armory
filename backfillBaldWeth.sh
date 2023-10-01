#!/bin/sh
. /root/.bashrc
foundryup
yarn generate:contracts && yarn ts-node src/WatchTowerArmory.ts \
--token0=0x4200000000000000000000000000000000000006 \
--token1=0x27D2DECb4bFC9C76F0309b8E88dec3a601Fe25a8 \
--feeTier=10000 \
--startBlock=3119551 \