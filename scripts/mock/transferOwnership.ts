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
  if (network.name === "coq") {
    newOwner = "0x20cD8eB93c50BDAc35d6A526f499c0104958e3F6";
    bridgeContract = "";
  } else if (network.name === "bsctest") {
    newOwner = "0x20cD8eB93c50BDAc35d6A526f499c0104958e3F6";
    bridgeContract = "";
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
