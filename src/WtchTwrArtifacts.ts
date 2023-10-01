//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WtchTwr
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const wtchTwrABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'wadObservationIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'wadDiffInHours', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'calculateVal',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      {
        name: 'baseToken',
        internalType: 'contract IERC20TokenV06',
        type: 'address',
      },
      {
        name: 'quoteToken',
        internalType: 'contract IERC20TokenV06',
        type: 'address',
      },
      { name: 'feeTier', internalType: 'uint24', type: 'uint24' },
    ],
    name: 'getFullObservationsArray',
    outputs: [
      {
        name: '',
        internalType: 'struct ObservationData[]',
        type: 'tuple[]',
        components: [
          { name: 'price', internalType: 'uint160', type: 'uint160' },
          { name: 'timestamp', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'tokenA', internalType: 'address', type: 'address' },
      { name: 'tokenB', internalType: 'address', type: 'address' },
      { name: 'fee', internalType: 'uint24', type: 'uint24' },
    ],
    name: 'getPoolAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'averageTick', internalType: 'int24', type: 'int24' },
      { name: 'baseTokenDecimals', internalType: 'uint8', type: 'uint8' },
      { name: 'quoteTokenDecimals', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'getPrice',
    outputs: [{ name: 'price', internalType: 'uint160', type: 'uint160' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      {
        name: 'baseToken',
        internalType: 'contract IERC20TokenV06',
        type: 'address',
      },
      {
        name: 'quoteToken',
        internalType: 'contract IERC20TokenV06',
        type: 'address',
      },
      { name: 'feeTier', internalType: 'uint24', type: 'uint24' },
    ],
    name: 'getPrices',
    outputs: [
      {
        name: '',
        internalType: 'struct ObservationData[]',
        type: 'tuple[]',
        components: [
          { name: 'price', internalType: 'uint160', type: 'uint160' },
          { name: 'timestamp', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      {
        name: 'baseToken',
        internalType: 'contract IERC20TokenV06',
        type: 'address',
      },
      {
        name: 'quoteToken',
        internalType: 'contract IERC20TokenV06',
        type: 'address',
      },
      { name: 'feeTier', internalType: 'uint24', type: 'uint24' },
    ],
    name: 'getTwapPriceNow',
    outputs: [{ name: 'price', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'pure',
    type: 'function',
    inputs: [{ name: 'value', internalType: 'uint256', type: 'uint256' }],
    name: 'mostSignificantDigit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'uniswapV3Factory', internalType: 'address', type: 'address' },
    ],
    name: 'setUniswapFactory',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'v3Factory',
    outputs: [
      { name: '', internalType: 'contract IUniswapV3Factory', type: 'address' },
    ],
  },
] as const


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// erc20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20ABI = [
  {
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
  },
] as const
