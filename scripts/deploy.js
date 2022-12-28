async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    // const NFT = await ethers.getContractFactory("NFT");
    // const nft = await NFT.deploy();

    // const METAC = await ethers.getContractFactory("METAC");
    // const metacoms = await METAC.deploy();

    const SwapContract = await ethers.getContractFactory("SwapContract");
    const swap = await SwapContract.deploy();
  
    console.log("Token address:", swap.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });