# Auction-Marketplace

This is a basic hardhat template to get you started writing and compiling contract.
The template is configured with some sensible defaults but tries to stay minimal.
It comes with most sensible plugins already installed via the suggested `hardhat-toolbox`.

- [Hardhat](https://github.com/nomiclabs/hardhat): compile and run the smart contracts on a local development network
- [TypeChain](https://github.com/ethereum-ts/TypeChain): generate TypeScript types for smart contracts
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation

Use the template by clicking the "Use this template" button at the top of the page.

## Usage

### Pre Requisites

Before running any command, make sure to install dependencies:

```sh
$ npm install
```
### Add .env
```sh
$ INFURA_KEY= //Add your infura key to create RPC
$ WALLET_KEY= //Add your wallet private key 
$ ETHEREUM_KEY= //Add etherscan private key to verify contract on etherscan
$ POLYGON_KEY= //Add polygonscan private key to verify contract on polygon
```
### Compile

Compile the smart contracts with Hardhat:

```sh
$ npx hardhat compile
```

### Test

Run the tests:

```sh
$ npx hardhat test
```

### Deploy contract to network (requires Mnemonic and Infura API key)

```
npx hardhat run scripts/deploy.js --network goerli 
```

### Validate a contract with etherscan (requires API key)

```
npx hardhat verify --network <network> <DEPLOYED_CONTRACT_ADDRESS> "Constructor argument 1"
```

## License

MIT
