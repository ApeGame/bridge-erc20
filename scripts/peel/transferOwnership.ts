import { network, ethers, upgrades } from "hardhat";
import { Sleep } from "../common";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

let newOwner;
let bridgeContract;

async function main() {
  if (network.name === "ape") {
    newOwner = "0xE874838932Fd109081FB36D76672925Fbc429E85";
    bridgeContract = "0x0880f9626ab5D65Ee791afaa5eDB20eEFCC15384";
  } else if (network.name === "bsc") {
    newOwner = "0x8909bB393bB4fF776b490f79C5Fab60edd70e88e";
    bridgeContract = "0xA27e024FA03421d86CD1Dbd48cFf7948B5EcCcbf";
  } else {
    return;
  }

  // bridge transferOwnership
  const bridge = await ethers.getContractAt("Bridge", bridgeContract);
  await bridge.transferOwnership(newOwner);

  // sleep 2s
  await Sleep(2000);

  // proxy admin transferOwnership
  await upgrades.admin.transferProxyAdminOwnership(newOwner);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
