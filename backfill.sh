#!/bin/sh
. /root/.bashrc
foundryup
yarn generate:contracts && yarn ts-node src/WatchTowerArmory.ts \
--token0=0x4200000000000000000000000000000000000006 \
--token1=0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA \
--feeTier=500 \
--startBlock=4335502 \