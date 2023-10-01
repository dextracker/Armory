/** @format */

import { config } from 'dotenv';
import { execSync } from 'child_process';
import { spawn, ChildProcess } from 'child_process';
import { backfillObservationsArray } from './WatchTowerUtils';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { erc20ABI } from './WtchTwrArtifacts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { backgroundRGBColor, hexToRgb, linearGradient } from 'tintify';

config();

console.log("SUPABASE_URL " + process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY " + process.env.SUPABASE_ANON_KEY);
console.log("SUPABASE_EMAIL " + process.env.SUPABASE_EMAIL);
console.log("SUPABASE_PASSWORD " + process.env.SUPABASE_PASSWORD);

let forkUrl: string | undefined = process.env.FORK_URL;
const increment: number = (43200/24)/30;
let blockNumber: number;
if (!forkUrl) {
	console.error('FORK_URL not found in .env');
	process.exit(1);
}
let realBlockNumber: number;

const requestData = {
	method: 'eth_blockNumber',
	params: [],
	id: 1, // You can use any unique number as the request ID
	jsonrpc: '2.0',
};

const rpcClient = createPublicClient({
	chain: base,
	transport: http(process.env.FORK_URL, { timeout: 60_000 }),
});
const anvilClient = createPublicClient({
	chain: base,
	transport: http(process.env.ANVIL_URL, { timeout: 60_000 }),
});

const supabase = createClient<Database>(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_ANON_KEY!
);

// Create a fetch request to the Ethereum node
fetch(forkUrl, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify(requestData),
})
	.then((response) => {
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		return response.json();
	})
	.then((data) => {
		// The block number is in hexadecimal format, so you might want to convert it to decimal
		const blockNumberDecimal = parseInt(data.result, 16);
		console.log('Latest block number:', blockNumberDecimal);
	})
	.catch((error) => {
		console.error('Error:', error);
	});

let processInstance: ChildProcess | null = null;

function startProcess(argv: {
	feeTier: number;
	token0: string;
	token1: string;
	startBlock: number;
	endBlock: number;
}): void {
	if (processInstance) {
		processInstance.kill();
	}

	processInstance = spawn(
		'anvil',
		[
			`--fork-url=${process.env.FORK_URL}`,
			`--fork-block-number=${blockNumber}`,
		],
		//{ stdio: ['pipe', 'pipe', process.stderr] }
		{ stdio: 'inherit' }
	);

	processInstance.on('error', (error: Error) => {
		console.error(`Error: ${error.message}`);
	});

	// Wait for a few seconds to ensure the anvil process has started
	setTimeout(startObservation, 5000);
}

async function startObservation(): Promise<void> {
	const realBlockNumber = Number(await rpcClient.getBlockNumber());
	const targetBlockTimestamp = new Date(
		Number(
			(
				await anvilClient.getBlock({
					blockNumber: await anvilClient.getBlockNumber(),
				})
			).timestamp
		) * 1000
	);
	// if (realBlockNumber < blockNumber) {
	// 	// console.log('Successfully backfilled all hourly observations');
	// 	// if (processInstance) {
	// 	// 	processInstance.kill('SIGKILL');
	// 	// 	console.log('Anvil process killed');
	// 	// }
	// 	blockNumber = realBlockNumber;
	// }
	try {
		const argv: {
			feeTier: number;
			token0: string;
			token1: string;
			startBlock: number;
			endBlock: number;
		} = yargs(hideBin(process.argv))
			.option('token0', {
				type: 'string',
				description: 'Token0 Address',
				demandOption: true, // makes it mandatory
			})
			.option('token1', {
				type: 'string',
				description: 'Token1 Address',
				demandOption: true, // makes it mandatory
			})
			.option('feeTier', {
				type: 'number',
				description: 'Fee Tier of the desired UniswapV3 pool',
				demandOption: true, // makes it mandatory
			})
			.option('startBlock', {
				type: 'number',
				description: 'Block to begin collecting observations from',
				demandOption: true, // makes it mandatory
			})
			.option('endBlock', {
				type: 'number',
				description:
					'Block to stop collecting observations. running without --endBlock will backfill from a specified block and run continuously until it is stopped.',
				demandOption: false, // makes it mandatory
			}).argv as {
			feeTier: number;
			token0: string;
			token1: string;
			startBlock: number;
			endBlock: number;
		};
		await backfill(argv.token0, argv.token1, argv.feeTier);

		if (processInstance) {
			processInstance.kill();
			console.log('Anvil process killed');
		}
		blockNumber += increment;
		const targetBlock = argv.endBlock ? argv.endBlock : realBlockNumber;
		if (targetBlock < blockNumber) {
			if(argv.endBlock){
				console.log('Successfully backfilled all hourly observations');
				console.log('	Shutting down....');
				if (processInstance) {
					processInstance.kill('SIGKILL');
					process.exit(0);
				}
			}
			console.log('Successfully backfilled all hourly observations watching for new observations');
			blockNumber = realBlockNumber;
		}
		console.log(
			`🏰 WtchTwr: Observation completed, restarting Anvil @ BlockHeight ${blockNumber} ${targetBlockTimestamp.toLocaleDateString()}`
		);
		startProcess(argv);
	} catch (error) {
		console.error('An error occurred during the observation process:', error);
	}
}

async function backfill(token0: string, token1: string, feeTier: number) {
	const token0decimals = await anvilClient.readContract({
		address: token0 as `0x${string}`,
		abi: erc20ABI,
		functionName: 'decimals',
	});
	const token1decimals = await anvilClient.readContract({
		address: token1 as `0x${string}`,
		abi: erc20ABI,
		functionName: 'decimals',
	});

	await backfillObservationsArray(
		token0,
		token1,
		feeTier,
		token0decimals,
		token1decimals
	);
}

function WatchTowerBackfill() {
	const argv: {
		feeTier: number;
		token0: string;
		token1: string;
		startBlock: number;
		endBlock: number;
	} = yargs(hideBin(process.argv))
		.option('token0', {
			type: 'string',
			description: 'Token0 Address',
			demandOption: true, // makes it mandatory
		})
		.option('token1', {
			type: 'string',
			description: 'Token1 Address',
			demandOption: true, // makes it mandatory
		})
		.option('feeTier', {
			type: 'number',
			description: 
			`${linearGradient(
				'Fee Tier of the desired UniswapV3 pool',
				hexToRgb('#FB6CAE'),
				hexToRgb('#7966FB')
			)}`,
			demandOption: true, // makes it mandatory
		})
		.option('startBlock', {
			type: 'number',
			description: 'Block to begin collecting observations from',
			demandOption: true, // makes it mandatory
		})
		.option('endBlock', {
			type: 'number',
			description:
				'Block to stop collecting observations. running without --endBlock will backfill from a specified block and run continuously until it is stopped.',
			demandOption: false, // makes it mandatory
		}).argv as {
		feeTier: number;
		token0: string;
		token1: string;
		startBlock: number;
		endBlock: number;
	};
	blockNumber = argv.startBlock;
	startProcess(argv);
}

const worldBgColor = backgroundRGBColor(hexToRgb('#FB6CAE'));
const asciiArt = `
      @@@@@@   @@@@@@@   @@@@@@@@@@    @@@@@@   @@@@@@@   @@@ @@@  
      @@@@@@@@  @@@@@@@@  @@@@@@@@@@@  @@@@@@@@  @@@@@@@@  @@@ @@@ 
      @@!  @@@  @@!  @@@  @@! @@! @@!  @@!  @@@  @@!  @@@  @@! !@@ 
      !@!  @!@  !@!  @!@  !@! !@! !@!  !@!  @!@  !@!  @!@  !@! @!! 
      @!@!@!@!  @!@!!@!   @!! !!@ @!@  @!@  !@!  @!@!!@!    !@!@!  
      !!!@!!!!  !!@!@!    !@!   ! !@!  !@!  !!!  !!@!@!      @!!!  
      !!:  !!!  !!: :!!   !!:     !!:  !!:  !!!  !!: :!!     !!:   
      :!:  !:!  :!:  !:!  :!:     :!:  :!:  !:!  :!:  !:!   :!:    
      ::   :::  ::   :::  :::     ::   ::::: ::  ::   :::   ::     
      :   : :   :   : :   :      :     : :  :    :   : :    :      
`;

console.log(
	`${linearGradient(
		asciiArt,
		hexToRgb('#FB6CAE'),
		hexToRgb('#7966FB')
	)}`
);
console.log(
	`${linearGradient(
		"                         By WtchTwr.xyz                           ",
		hexToRgb('#FB6CAE'),
		hexToRgb('#7966FB')
	)}`
)
//console.log(armory);
WatchTowerBackfill();
