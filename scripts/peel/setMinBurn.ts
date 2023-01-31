import { network, ethers, upgrades } from "hardhat";
import { BigNumber, constants } from "ethers";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
let bridgeContract: string;
let peelContract: string;
let amount: BigNumber;

async function main() {
  if (network.name === "bsc") {
    bridgeContract = "0x3Cfb6eeA14731a1cc6be0530e558E4d9E8D40253";
    peelContract = "0x734548a9e43d2D564600b1B2ed5bE9C2b911c6aB";
    amount = ethers.utils.parseEther("10");
  } else if (network.name === "ape") {
    bridgeContract = "0x058Cb59e0D214dEC8176E76C714d1101C29E35a2";
    peelContract = constants.AddressZero;
    amount = ethers.utils.parseEther("50");
  }

  const BridgeProxy = await ethers.getContractAt("Bridge", bridgeContract);

  // 4、set min max burn
  const tx = await BridgeProxy.setMinBurn([peelContract], [amount]);
  await tx.wait();

  console.log("set completed");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
