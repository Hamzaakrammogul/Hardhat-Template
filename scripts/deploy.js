async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const feeAddress= "0xc82bD5c9cC02cAd6172b928f7Ef72646D9a3dA26";
    const MEAC= "0xb63E6b4a71f766892e859e08215ecbB01FeB3189";
    
    // const MeacToken = await ethers.getContractFactory("contracts/MEAC.sol:MeacToken");
    // const metacoms = await MeacToken.deploy("Metacoms", "MEAC", "18", "500000000000000000000000000");
    // console.log("Token address:", metacoms.address);

    const Staking_pool = await ethers.getContractFactory("Staking_pool");
    const staking = await Staking_pool.deploy(MEAC, feeAddress);
    console.log("Token address:", staking.address);

    // const SwapContract = await ethers.getContractFactory("SwapContract");
    // const swap = await SwapContract.deploy(metacoms.address);
    // console.log("Token address:", swap.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });