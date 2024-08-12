const { ethers } = require("hardhat");

async function main() {
  const TokenFactory = await ethers.getContractFactory("Token");
  const totalSupply = ethers.utils.parseEther("1000000");
  const token = await TokenFactory.deploy("Token", "TOKEN", totalSupply);
  await token.deployed();

  console.log("Token deployed to:", token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
