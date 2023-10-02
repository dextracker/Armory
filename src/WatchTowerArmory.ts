/** @format */

import { config } from 'dotenv';
import { execSync } from 'child_process';
import { spawn, ChildProcess } from 'child_process';
import { backfillObservationsArray } from './WatchTowerUtils';
import {
	Abi,
	createPublicClient,
	decodeAbiParameters,
	decodeEventLog,
	encodeFunctionData,
	http,
	parseAbi,
	parseAbiItem,
} from 'viem';
import { base } from 'viem/chains';
import {
	erc20ABI,
	uniswapV3FactoryABI,
	uniswapV3PoolABI,
} from './WtchTwrArtifacts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { backgroundRGBColor, hexToRgb, linearGradient } from 'tintify';
import { readContract } from 'viem/_types/actions/public/readContract';

config();

const uniswapV3FactoryAddress = '0x33128a8fC17869897dcE68Ed026d694621f6FDfD';

let forkUrl: string | undefined = process.env.FORK_URL;
const increment: number = 43200 / 24 / 30;
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

let processInstance: ChildProcess | null = null;

async function findCreationBlock(
	feeTier: number,
	token0: string,
	token1: string
): Promise<number> {
	const latestBlock = Number(await rpcClient.getBlockNumber());
	console.log(`Latest block is ${latestBlock}`);

	let startBlock = 2009446; // block of first pool creation on base
	let targetBlock;

	while (startBlock <= latestBlock) {
		let endBlock = startBlock + 9999;

		if (endBlock > latestBlock) {
			endBlock = latestBlock;
		}
		const log = await queryLogs(startBlock, endBlock);
		for (const [index, event] of log.eventLog.entries()) {
			let eventLog = event?.args as unknown as {
				token0: `0x${string}`;
				token1: `0x${string}`;
				fee: number;
				tickSpacing: number;
				pool: `0x${string}`;
			};
			eventLog ? console.log(eventLog) : null;

			if (
				eventLog &&
				eventLog.token0.toLowerCase() === token0.toLowerCase() &&
				eventLog.token1.toLowerCase() === token1.toLowerCase() &&
				eventLog.fee === feeTier
			) {
				console.log(
					'Token0: ' +
						eventLog.token0 +
						' Token1: ' +
						eventLog.token1 +
						' FeeTier: ' +
						eventLog.fee
				);
				console.log(
					'Found Pool Creation Event @ Block: ' +
						Number(log?.blockData[index].blockNumber)
				);
				targetBlock = await queryPoolCardinality(
					Number(log?.blockData[index].blockNumber),
					eventLog.pool
				);
				break;
			}
		}
		if (targetBlock) {
			break;
		} else {
			startBlock = endBlock + 1;
		}
	}
	return targetBlock!;
}

async function findCardinalityIncrease(
	feeTier: number,
	token0: string,
	token1: string
): Promise<number> {
	const latestBlock = Number(await rpcClient.getBlockNumber());
	console.log(`Latest block is ${latestBlock}`);

	let startBlock = 2009446; // block of first pool creation on base
	let targetBlock;

	while (startBlock <= latestBlock) {
		let endBlock = startBlock + 9999;

		if (endBlock > latestBlock) {
			endBlock = latestBlock;
		}
		const log = await queryLogs(startBlock, endBlock);
		let eventLog = log?.eventLog?.args as unknown as {
			token0: `0x${string}`;
			token1: `0x${string}`;
			fee: number;
			tickSpacing: number;
			pool: `0x${string}`;
		};

		if (
			eventLog &&
			eventLog.token0.toLowerCase() == token0 &&
			eventLog.token1.toLowerCase() == token1.toLowerCase() &&
			eventLog.fee == feeTier
		) {
			console.log(
				'Token0: ' +
					eventLog.token0 +
					' Token1: ' +
					eventLog.token1 +
					' FeeTier: ' +
					eventLog.fee
			);
			console.log(
				'Found Pool Creation Event @ Block: ' +
					Number(log?.blockData.blockNumber)
			);
			targetBlock = Number(log?.blockData.blockNumber);
			let cardinalityBlock = await queryPoolCardinality(
				targetBlock,
				eventLog.pool
			);
			break;
		}

		// // Wait for 2 seconds before the next fetch request
		// await new Promise(resolve => setTimeout(resolve, 2000));

		startBlock = endBlock + 1;
	}
	return targetBlock!;
}

async function queryPoolCardinality(
	targetBlock: number,
	pool: `0x${string}`
): Promise<number> {
	let cardinality;
	while (cardinality == null) {
		targetBlock += 9999;

		const response = await fetch(process.env.FILTER_URL!, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'eth_call',
				params: [
					{
						to: pool,
						data: '0x3850c7bd', // The first 4 bytes of the keccak256 hash of "slot0()"
					},
					`0x${Number(targetBlock).toString(16)}`, // You can specify which block to pull this information from
				],
			}),
		});
		const data = await response.json();

		const currentCardinality = data.result
			? decodeAbiParameters(
					[
						{ name: 'sqrtPriceX96', type: 'uint160' },
						{ name: 'tick', type: 'int24' },
						{ name: 'observationIndex', type: 'uint16' },
						{ name: 'observationCardinality', type: 'uint16' },
						{ name: 'observationCardinalityNext', type: 'uint16' },
						{ name: 'feeProtocol', type: 'uint8' },
						{ name: 'unlocked', type: 'bool' },
					],
					data.result
			  )[3]
			: null;
		currentCardinality && currentCardinality > 1
			? console.log(
					'First Cardinality Increase: ' +
						currentCardinality +
						' ' +
						Number(targetBlock)
			  )
			: null;
		currentCardinality && currentCardinality > 1
			? (cardinality = currentCardinality)
			: null;
	}
	return targetBlock;
}

async function queryLogs(startBlock: number, endBlock: number) {
	console.log('searching through blocks ' + startBlock + ' - ' + endBlock);
	const response = await fetch(process.env.FILTER_URL!, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'eth_getLogs',
			params: [
				{
					fromBlock: `0x${startBlock.toString(16)}`,
					toBlock: `0x${endBlock.toString(16)}`,
					address: uniswapV3FactoryAddress, // UniswapV3Factory address
					topics: [
						'0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
					], // PoolCreated(address,address,uint24,int24,address)
				},
			],
		}),
	});

	const data = await response.json();
	const blockData = data && data.result ? data.result : null;

	const allPools =
		blockData &&
		blockData.map((poolCreation: { data: any; topics: any[] }) => {
			return decodeEventLog({
				abi: uniswapV3FactoryABI,
				data: poolCreation.data,
				topics: [
					poolCreation.topics[0],
					poolCreation.topics[1],
					poolCreation.topics[2],
					poolCreation.topics[3],
				],
			});
		});
	return {
		blockData: blockData,
		eventLog: allPools,
	};
}

async function startProcess(argv: {
	feeTier: number;
	token0: string;
	token1: string;
	startBlock: number;
	endBlock: number;
}): Promise<void> {
	if (processInstance) {
		processInstance.kill();
	}

	blockNumber ? null : (blockNumber = argv.startBlock);

	processInstance = spawn(
		'anvil',
		[
			`--fork-url=${process.env.FORK_URL}`,
			`--fork-block-number=${blockNumber}`,
		],
		{ stdio: ['pipe', 'pipe', process.stderr] }
		//{ stdio: 'inherit' }
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
				description:
					'Block to begin collecting observations from, defualt: the earliest block that the specified pool has at least 2 observations',
				demandOption: false, // makes it mandatory
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
			if (argv.endBlock) {
				console.log('Successfully backfilled all hourly observations');
				console.log('	Shutting down....');
				if (processInstance) {
					processInstance.kill('SIGKILL');
					process.exit(0);
				}
			}
			console.log(
				'Successfully backfilled all hourly observations watching for new observations'
			);
			blockNumber = realBlockNumber;
		}
		console.log(
			`🏰 WtchTwr: Observation completed, restarting Anvil @ BlockHeight ${blockNumber} ${targetBlockTimestamp.toLocaleDateString()}`
		);

		await startProcess(argv);
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

async function WatchTowerBackfill() {
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
			description: `${linearGradient(
				'Fee Tier of the desired UniswapV3 pool',
				hexToRgb('#FB6CAE'),
				hexToRgb('#7966FB')
			)}`,
			demandOption: true, // makes it mandatory
		})
		.option('startBlock', {
			type: 'number',
			description: 'Block to begin collecting observations from',
			demandOption: false, // makes it mandatory
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

	const { data } = await supabase.auth.signInWithPassword({
		email: process.env.SUPABASE_EMAIL!,
		password: process.env.SUPABASE_PASSWORD!,
	});

	const block = await rpcClient.getBlock();

	const pool = await rpcClient.readContract({
		address: uniswapV3FactoryAddress as `0x${string}`,
		abi: uniswapV3FactoryABI,
		functionName: 'getPool',
		args: [
			argv.token0 as `0x${string}`,
			argv.token1 as `0x${string}`,
			argv.feeTier,
		],
	});

	let { data: Observations_Base_V1, error } = await supabase
		.from('Observations_Base_V1')
		.select('timestamp')
		.eq('pool', pool)
		.order('timestamp', { ascending: false })
		.limit(1);

	let latestDbBlock;
	if(Observations_Base_V1){
		const timeDiff = Number(block.timestamp) - Observations_Base_V1[0].timestamp!
		const blocktime = 2; //2 seconds
		const blocks = Math.floor(timeDiff / blocktime);
		latestDbBlock = Number(block.number) - blocks;
	}
	let startBlock;
	if(latestDbBlock) {
		let args = {
			feeTier: argv.feeTier,
			token0: argv.token0,
			token1: argv.token1,
			startBlock: latestDbBlock,
			endBlock: argv.endBlock,
		};
	
		await startProcess(args);

	}else {
		console.log(
			`Finding Creation Block for pair: ${argv.token0}/${argv.token1} : ${argv.feeTier}`
		);
		const creationBlock = await findCreationBlock(
			argv.feeTier,
			argv.token0,
			argv.token1
		);
		startBlock =
		argv.startBlock > creationBlock ? argv.startBlock : creationBlock;
		let args = {
			feeTier: argv.feeTier,
			token0: argv.token0,
			token1: argv.token1,
			startBlock: startBlock,
			endBlock: argv.endBlock,
		};
	
		await startProcess(args);
	}
	
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
	`${linearGradient(asciiArt, hexToRgb('#FB6CAE'), hexToRgb('#7966FB'))}`
);
console.log(
	`${linearGradient(
		'                         By WtchTwr.xyz                           ',
		hexToRgb('#FB6CAE'),
		hexToRgb('#7966FB')
	)}`
);
//console.log(armory);
WatchTowerBackfill();
