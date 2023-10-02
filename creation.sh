#!/bin/bash

# Initialize start block
start_block=2274119

# Get the latest block number
latest_block=$(curl -s -X POST --data '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_blockNumber",
  "params": []
}' -H "Content-Type: application/json" https://green-winter-tab.base-mainnet.discover.quiknode.pro/21b92745c02088800d8661a0eb403bc5d919181e/ | jq -r '.result')

# Convert latest block to integer
latest_block_int=$((latest_block))

echo "Latest block is $latest_block"

# Loop through blocks in steps of 10,000
while [ $start_block -le $latest_block_int ]
do
  end_block=$(($start_block + 9999))

  # Make sure end_block doesn't exceed latest_block
  if [ $end_block -gt $latest_block_int ]; then
    end_block=$latest_block_int
  fi

  echo "Querying from block $start_block to $end_block"

  # Perform the curl operation here
  response=$(curl -s -X POST --data "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"eth_getLogs\",
    \"params\": [{
      \"fromBlock\": \"$(printf '0x%x\n' $start_block)\",
      \"toBlock\": \"$(printf '0x%x\n' $end_block)\",
      \"address\": \"0x33128a8fC17869897dcE68Ed026d694621f6FDfD\",
      \"topics\": [\"0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118\"]
    }]
  }" -H "Content-Type: application/json" https://green-winter-tab.base-mainnet.discover.quiknode.pro/21b92745c02088800d8661a0eb403bc5d919181e/)

  echo "Response: $response"

  # Update start_block for next iteration
  start_block=$(($end_block + 1))
done
