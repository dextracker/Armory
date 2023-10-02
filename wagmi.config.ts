import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import {config} from 'dotenv';
import { erc20ABI } from 'wagmi';
import {WtchTwrAbi, uniswapV3FactoryAbi, uniswapV3PoolAbi} from './src/WatchTowerAbi';
config();

async function fetchABI(address: string) {
  let result;
  try {
    const response = await fetch(`https://api.basescan.org/api?module=contract&action=getabi&address=${address}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    result = await response.json();
  } catch (error) {
    console.error("An error occurred:", error);
    // Handle the error as needed
    return null;
  }

  return result;
}


export default defineConfig(async () => {
    console.log(
        `Generating Artifacts For | WtchTwr: ${process.env.WTCHTWR_ADDRESS}`
    )
    return {
        out: "src/WtchTwrArtifacts.ts",
        contracts: [
          {
            name: 'erc20',
            abi: erc20ABI,
          },
          {
            name: 'uniswapV3Pool',
            abi: uniswapV3PoolAbi,
          },
          {
            name: 'uniswapV3Factory',
            abi: uniswapV3FactoryAbi,
          },
          {
            name: 'WtchTwr',
            abi: WtchTwrAbi,
            address: process.env.WTCHTWR_ADDRESS,
          }
        ],
        plugins: [
            
        ]
      }
}

);
