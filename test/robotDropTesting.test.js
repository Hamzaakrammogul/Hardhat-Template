const { expect } = require("chai"); 

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

let CreateNFTContract;
let CreateCubeContract;
let cube;
let WethContract;
let weth9;
let createAuctionContract;
let auction;
let addr1, addr2, deployer, addrs;
let feePercent= 1;
let URI= "0x00";

describe("Create NFT Contract", function(){

  beforeEach("Deploy Function", async function(){
    CreateNFTContract = await ethers.getContractFactory("CreateNFTContract");
    [deployer, addr1, addr2, ...addrs]= await ethers.getSigners();
    NFT = await CreateNFTContract.deploy("Robot Drop NFT", "RD(NFT)");
  });

  describe("createBatch Testing", function(){
    let name = "Robot Drop NFT";
    let symbol= "RD(NFT)";
  it("Check Name and Symbol", async function(){

    let contractName= await NFT.name();
    let contractSymbol= await NFT.symbol();
    expect(contractName).to.equal(name);
    expect(contractSymbol).to.equal(symbol);
  });
  
  it("Testing newBatch Fucntionality", async function(){
    //Minting from addr1
    await NFT.connect(addr1).newBatch([0], [1], "0x00");
    //Checking Balance of addr1
    let bal= await NFT.balanceOf(addr1.address, 0);
    expect(bal).to.equal("1");
    //Minting from addr2
    await NFT.connect(addr2).newBatch([0], [2], "0x00");
    //Checking balance of addr2
    let bal2= await NFT.balanceOf(addr2.address, 0);
    expect(bal2).to.equal("2");
  });

  it("Testing batchMinting functionality", async function (){
    //Balance before Minting
    let initialBal= await NFT.balanceOf(addr1.address, 0);
    expect(initialBal).to.equal(0);
    //Minting from addr1
    await NFT.connect(addr1).batchMinting([0], [1], ["0x00"]);
    //balance after Mintig
    let finalBal = await NFT.balanceOf(addr1.address, 0);
    expect(finalBal).to.equal(1);
  })
  });
});

describe("Create Cube Contract", function () {
  beforeEach( async function(){
    CreateCubeContract = await ethers.getContractFactory("CreateCubeContract");
    [deployer, addr1, addr2,...addrs] = await ethers.getSigners();
    cube = await CreateCubeContract.deploy();
  });

describe("Deployment", function(){

  it("Should has the same name and right symbol", async function(){
    let name = "CUBE(NFT)";
    let symbol = "CNT";
    expect(await cube.name()).to.equal(name);
    expect(await cube.symbol()).to.equal(symbol);
  });
});
describe("Minting Cube NFTs", function(){
  it("Should able to mint cube NFT", async function (){
    //Minitng NFT from two addresses 
    await cube.connect(addr1).createCube("0x00");
    await cube.connect(addr2).createCube("0x00");
    //Checking addr1 and addr2 balances for confirmation
    let bal= await cube.balanceOf(addr1.address);
    expect(bal).to.equal("1");
    let bal2= await cube.balanceOf(addr2.address);
    expect(bal2).to.equal("1");
  });
});
describe("Transfer From Functionality", function(){
  it("Should be able to to transfer NFT", async function (){
    //Minting NFT from addr1
    await cube.connect(addr1).createCube("0x00");
    //Checking balamces of addr1 and addr2
    let initialBal1 = await cube.balanceOf(addr1.address);
    expect(initialBal1).to.equal("1");
    let initialBal2= await cube.balanceOf(addr2.address);
    expect(initialBal2).to.equal("0");
    //Transfering NFT from Addr1 to addr2
    await cube.connect(addr1).transferCube(addr1.address, addr2.address, "0" );
    //Checking balances after the transfer
    let finalBal1= await cube.balanceOf(addr1.address);
    expect(finalBal1).to.equal("0");
    let finalBal2= await cube.balanceOf(addr2.address);
    expect(finalBal2).to.equal("1");
  });
  it("it should allow thrid party to spend on behalf of owner", async function(){
    // Creating cube nft by addr1
    await cube.connect(addr1).createCube("0x00");
    //checking balance before transfer 
    expect(await cube.balanceOf(addr1.address)).to.equal("1");
    expect(await cube.balanceOf(addr2.address)).to.equal("0");
    // approving deployer to spend on addr1 behalf
    await cube.connect(addr1).setApprovalForAll(deployer.address, true);
    //Deployer transfer addr1 nft to addr2
    await cube.connect(deployer).transferCube(addr1.address, addr2.address, "0");
    //checking balance of addr1 and addr2 
    expect(await cube.balanceOf(addr1.address)).to.equal("0");
    expect(await cube.balanceOf(addr2.address)).to.equal("1");
  });
});
});
describe("Weth9 Contract", function() {
  beforeEach( async function(){
    WethContract = await ethers.getContractFactory("WETH9");
    [deployer, addr1, addr2,...addrs]= await ethers.getSigners();
    weth9= await WethContract.deploy()
  });
  describe("Deployment", function(){
    it("Should has the same name, symbol and decimals", async function(){
      let name = "Wrapped Ether";
      let symbol = "WETH";
      let decimals = 18;

      expect (await weth9.name()).to.equal(name);
      expect (await weth9.symbol()).to.equal(symbol);
      expect (await weth9.decimals()).to.equal(decimals);
    });
  });
  describe("Deposit Functionality Testing", async function(){
    it("Should be able to deposit the ether", async function(){
      //Depositing ether into the weth contract
      await weth9.connect(addr1).deposit({value: ethers.utils.parseEther("1")});
      //Checing balance of addr1 for confirmation
      let bal1= await weth9.balanceOf(addr1.address);
      expect(bal1).to.equal("1000000000000000000");
    });
  });
  describe("WithDraw Functionality", async function(){
    it("Should be able to withdraw ether", async function(){
      //deposit 1 ether into weth contract by addr1
      await weth9.connect(addr1).deposit({value: ethers.utils.parseEther("1")});
      //checkig balance before withdraw
      let initialBal= await weth9.balanceOf(addr1.address);
      expect(initialBal).to.equal("1000000000000000000");
      //Withdrawing ether from the contract
      await weth9.connect(addr1).withdraw("1000000000000000000");
      //checking balances after withdrawing 
      let finalBal= await weth9.balanceOf(addr1.address);
      expect(finalBal).to.equal("0");
    });
  });
  describe("transfer and transferFrom functionality", function(){
    it("Should be able to trasfer weth from one account to another", async function(){
      //Depositing weth form addr1 address
      await weth9.connect(addr1).deposit({value: ethers.utils.parseEther("1")});
      //Checking balances of addr1 and addr2 before transfer
      let initialBal1= await weth9.balanceOf(addr1.address);
      expect(initialBal1).to.equal("1000000000000000000");
      let initialBal2= await weth9.balanceOf(addr2.address);
      expect(initialBal2).to.equal("0");
      //Transfering from addr1 to addr2
      await weth9.connect(addr1).transfer(addr2.address, "1000000000000000000");
      //Checking balances after transfer
      let finalBal1= await weth9.balanceOf(addr1.address);
      expect(finalBal1).to.equal("0");
      let finalBal2= await weth9.balanceOf(addr2.address);
      expect(finalBal2).to.equal("1000000000000000000");
    });

    it("It should allow a thirdparty to spend on owner behalf", async function(){
      //deposit 1 ether from addr1
      await weth9.connect(addr1).deposit({value: ethers.utils.parseEther("1")});
      expect(await weth9.balanceOf(addr1.address)).to.equal("1000000000000000000");
      //approving deployer to spend on addr1 behalf
      await weth9.connect(addr1).approve(deployer.address, "1000000000000000000");
      // deployer spending on addr1 behalf
      await weth9.connect(deployer).transferFrom(addr1.address, addr2.address, "1000000000000000000");
      //Checing balnces after transfer 
      expect(await weth9.balanceOf(addr1.address)).to.equal("0");
      expect(await weth9.balanceOf(addr2.address)).to.equal("1000000000000000000");
    });
  });
});
describe("Auction Contract", function() {
  beforeEach( async function(){
    //Getting instances of all the contracts
    createAuctionContract= await ethers.getContractFactory("createAuctionContract");
    CreateCubeContract= await ethers.getContractFactory("CreateCubeContract");
    WethContract= await ethers.getContractFactory("WETH9");
    //Gettign the signers
    [deployer, addr1, addr2, ...addrs]= await ethers.getSigners();
    // Deploying the contracts
    auction= await createAuctionContract.deploy("Robot Drop Auction");
    cube= await CreateCubeContract.deploy();
    weth9= await WethContract.deploy();
  });
  describe("Deployment", function(){
    it("Should have same name as of the contracts", async function(){
      let name = "Robot Drop Auction";
      let wethname= "Wrapped Ether";
      let cubename= "CUBE(NFT)";
      expect(await auction.name()).to.equal(name);
      expect(await cube.name()).to.equal(cubename);
      expect(await weth9.name()).to.equal(wethname);
    });
  });
  describe("Checking new Auction functionality", function(){
    it("Should be able to create new auction", async function(){
      /**
       * First lets create cube nft using cube contract
       * Give approval to auction address
       */
      await cube.connect(addr1).createCube("0x00");
      await cube.connect(addr1).setApprovalForAll(auction.address, true);
      //lets create a new auction now
      await auction.connect(addr1).newAuction(
        cube.address,
        weth9.address,
        "0",
        toWei("0.1"),
        "1669913626",
        "1669915500"
      );
      // Confirming auction by index
      expect(await auction.index()).to.equal("1");
      // First deposit money into weth contract 
      await weth9.connect(addr2).deposit({value: ethers.utils.parseEther("1")});
      // Approving auction address
      await weth9.connect(addr2).approve(auction.address, "1000000000000000000");
      // Biding on the auction 
      await auction.connect(addr2).bid("0", toWei("1"));

    });
  });
});

describe("Market Place Contract", function () {
  let price = 1
 
  let result 
   beforeEach(async function () {
   let Cube = await ethers.getContractFactory("CreateCubeContract");
   let Marketplace= await ethers.getContractFactory("Marketplace");
   [deployer, addr1, addr2, ... addrs] = await ethers.getSigners();
   nft = await Cube.deploy();
   marketplace = await Marketplace.deploy(feePercent);
    // addr1 mints an nft
    await nft.connect(addr1).createCube(URI);
    // addr1 approves marketplace to spend nft
    await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
  });


  it("Should track newly created item, transfer NFT from seller to marketplace and emit Offered event", async function () {
    // addr1 offers their nft at a price of 1 ether
    await expect(marketplace.connect(addr1).makeItem(nft.address, 0 , toWei(price)))
      .to.emit(marketplace, "Offered")
      .withArgs(
        1,
        nft.address,
        0,
        toWei(price),
        addr1.address
      )
    // Owner of NFT should now be the marketplace
    expect(await nft.ownerOf(0)).to.equal(marketplace.address);
    // Item count should now equal 1
    expect(await marketplace.itemCount()).to.equal(1)
    // Get item from items mapping then check fields to ensure they are correct
    const item = await marketplace.items(1)
    expect(item.itemId).to.equal(1)
    expect(item.nft).to.equal(nft.address)
    expect(item.tokenId).to.equal(0)
    expect(item.price).to.equal(toWei(price))
    expect(item.sold).to.equal(false)
  });

  it("Should fail if price is set to zero", async function () {
    await expect(
      marketplace.connect(addr1).makeItem(nft.address, 1, 0)
    ).to.be.revertedWith("Price must be greater than zero");
  });

});
describe("Purchasing marketplace items", function () {
  let price = 2
  let fee = (feePercent/100)*price
  let totalPriceInWei
  beforeEach(async function () {
    let Cube = await ethers.getContractFactory("CreateCubeContract");
    let Marketplace= await ethers.getContractFactory("Marketplace");
    [deployer, addr1, addr2, ... addrs] = await ethers.getSigners();
    nft = await Cube.deploy();
    marketplace = await Marketplace.deploy(feePercent);
    // addr1 mints an nft
    await nft.connect(addr1).createCube(URI)
    // addr1 approves marketplace to spend tokens
    await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
    // addr1 makes their nft a marketplace item.
    await marketplace.connect(addr1).makeItem(nft.address, 0, toWei(price))
  });
  it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function () {
    const sellerInitalEthBal = await addr1.getBalance()
    const feeAccountInitialEthBal = await deployer.getBalance()
    // fetch items total price (market fees + item price)
    totalPriceInWei = await marketplace.getTotalPrice(1);
    // addr 2 purchases item.
    await expect(marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei}))
    .to.emit(marketplace, "Bought")
      .withArgs(
        1,
        nft.address,
        0,
        toWei(price),
        addr1.address,
        addr2.address
      )
    const sellerFinalEthBal = await addr1.getBalance()
    const feeAccountFinalEthBal = await deployer.getBalance()
    // Item should be marked as sold
    expect((await marketplace.items(1)).sold).to.equal(true)
    // Seller should receive payment for the price of the NFT sold.
    expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitalEthBal))
    // feeAccount should receive fee
    expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal))
    // The buyer should now own the nft
    expect(await nft.ownerOf(0)).to.equal(addr2.address);
  })
  it("Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
    // fails for invalid item ids
    await expect(
      marketplace.connect(addr2).purchaseItem(2, {value: totalPriceInWei})
    ).to.be.revertedWith("item doesn't exist");
    await expect(
      marketplace.connect(addr2).purchaseItem(0, {value: totalPriceInWei})
    ).to.be.revertedWith("item doesn't exist");
    // Fails when not enough ether is paid with the transaction. 
    // In this instance, fails when buyer only sends enough ether to cover the price of the nft
    // not the additional market fee.
    await expect(
      marketplace.connect(addr2).purchaseItem(1, {value: toWei(price)})
    ).to.be.revertedWith("not enough ether to cover item price and market fee"); 
    // addr2 purchases item 1
    await marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei})
    // addr3 tries purchasing item 1 after its been sold 
    const addr3 = addrs[0]
    await expect(
      marketplace.connect(addr3).purchaseItem(1, {value: totalPriceInWei})
    ).to.be.revertedWith("item already sold");
  });
});
