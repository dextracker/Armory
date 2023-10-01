<style>

.clip{
  width:100%;
  height:20%;
  background: -webkit-gradient(linear,left top,left bottom,from(#FB6CAE), to(#7966FB));
  font-size:51px;
  font-family:'tahoma';
  text-align:center;
  -webkit-background-clip:text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0px 0px 5px #FB6CAE, 0px 0px 10px #FB6CAE, 0px 0px 15px #7966FB, 0px 0px 2px #7966FB, 0px 0px 3px #7966FB, 0px 0px 3px #7966FB, 0px 0px 35px #ff5500;
  
}
</style>

<pre class="clip">
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
</pre>
## Running Armory

### Docker

To build and run the service using Docker, follow these steps:

1. Navigate to the root directory of your repository.

2. Build the Docker image:

    ```bash
    docker build /Users/{your username}/path/to/repo -t watch-tower-armory
    ```

    Replace `{your username}` and `path/to/repo` with your actual username and the path to your repository.

3. Run the Docker container:

    ```bash
    docker run --env-file .env watch-tower-armory bash
    ```

    This will run the container and execute the `bash` shell, using the environment variables specified in your `.env` file.

### Local Testing

To test the service locally, you can simply run the `backfill.sh` script:

```bash
sh backfill.sh
```
## Environment Setup

Create a `.env` file in the root directory of your project and populate it with the following keys:

```sh
# RPC URL for the blockchain network you're connecting to
FORK_URL={your rpc url here}

# Your Etherscan API key for interacting with Etherscan's API
ETHERSCAN_API_KEY={your etherscan api key}

# Address for the Watchtower contract
WTCHTWR_ADDRESS=0x731CB243C91FF16e96C24DCcB7aC6Ddf2C57222b

# Supabase URL for your project
SUPABASE_URL=https://{your link here}.supabase.co

# Supabase anonymous key
SUPABASE_ANON_KEY={your anon key here}

# Supabase login email
SUPABASE_EMAIL={your supabase login email}

# Supabase login password
SUPABASE_PASSWORD={your supabase login password}

# Anvil URL for your local setup (needs to be anvil as anvil only rpc commands are used)
ANVIL_URL=http://127.0.0.1:8545
```


## Adding Additional Contracts and ABIs to Wagmi Configuration

To add more contracts and their corresponding ABIs, you can extend the `contracts` array in your Wagmi configuration file. Here's how you can do it:

1. Import the ABI of the contract you want to add. You can either import it from a file or fetch it dynamically.

    ```typescript
    import { YourContractAbi } from './path/to/YourContractAbi';
    // OR dynamically fetch ABI
    async function fetchABI(address: string) {
      // Your fetch logic here
    }
    ```

2. Add a new object to the `contracts` array in your Wagmi configuration:

    ```typescript
    contracts: [
      {
        name: 'erc20',
        abi: erc20ABI,
      },
      {
        name: 'WtchTwr',
        abi: WtchTwrAbi,
        address: process.env.WTCHTWR_ADDRESS,
      },
      {
        name: 'YourContract',
        abi: YourContractAbi,
        address: 'YourContractAddressHere',
      }
    ]
    ```

3. Make sure to replace `'YourContract'` with the name you want to use for the contract, and `'YourContractAddressHere'` with the actual contract address.

4. If you're fetching the ABI dynamically, you can use async functions to populate the `abi` field:

    ```typescript
    const yourDynamicABI = await fetchABI('YourContractAddressHere');
    ```

5. Save the configuration file and run your Wagmi CLI commands as usual.

By following these steps, you can easily extend your Wagmi configuration to include additional contracts and ABIs.

