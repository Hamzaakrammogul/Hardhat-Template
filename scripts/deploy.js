async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    // const NFT = await ethers.getContractFactory("NFT");
    // const nft = await NFT.deploy();
     const feeAddress= "0xc82bD5c9cC02cAd6172b928f7Ef72646D9a3dA26";
    const MeacToken = await ethers.getContractFactory("MeacToken");
    const metacoms = await MeacToken.deploy("Metacoms", "MEAC", "18", "500000000000000000000000000");
    console.log("Token address:", metacoms.address);

    const Staking_pool = await ethers.getContractFactory("Staking_pool");
    const staking = await Staking_pool.deploy(metacoms.address, feeAddress);
    console.log("Token address:", staking.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });