import { network, ethers, upgrades } from "hardhat";
import { BigNumber, constants } from "ethers";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const feeReceiver = "0x5767A8EdE4d14595162920C4019a5e79D685FF67";
let bridgeContract;

async function main() {
  if (network.name === "ape") {
    bridgeContract = "0x0880f9626ab5D65Ee791afaa5eDB20eEFCC15384";
  } else if (network.name === "bsc") {
    bridgeContract = "0xA27e024FA03421d86CD1Dbd48cFf7948B5EcCcbf";
  } else {
    return;
  }

  const BridgeProxy = await ethers.getContractAt("Bridge", bridgeContract);

  // 4、set min max burn
  const tx = await BridgeProxy.setFeeReceiver(feeReceiver);
  await tx.wait();

  console.log("set fee receiver");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
