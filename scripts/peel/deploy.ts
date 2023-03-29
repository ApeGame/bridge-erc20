// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { VerifyContractBlockScout } from "../common-blockscout";
import { VerifyContractEthScan } from "../common-ethscan";
import { Sleep } from "../common";
import { ethers, network } from "hardhat";

async function main() {
  // 4、deploy bridge contract
  const BridgeFactory = await ethers.getContractFactory("Bridge");
  const bridge = await BridgeFactory.deploy();

  console.log(`bridge logic address: ${bridge.address}`);
  // sleep 10s
  await Sleep(10000);

  if (network.name === "bsc") {
    const baseUrl: string = "https://api.bscscan.com/api";
    const apikey: string = "Z86V9AC619GAGEYVWBP86CTGDDPSS4JS8R";
    console.log(
      `bridge(${
        bridge.address
      }) verify & push contract, guid: ${await VerifyContractEthScan(
        bridge.address,
        "contracts/Bridge.sol:Bridge",
        "",
        baseUrl,
        apikey
      )}`
    );
  }

  if (network.name === "ape") {
    const baseUrl: string = "https://explorer.bas.metaapesgame.com/api";
    console.log(
      `bridge(${
        bridge.address
      }) verify & push contract, guid: ${await VerifyContractBlockScout(
        bridge.address,
        "contracts/Bridge.sol:Bridge",
        "",
        baseUrl
      )}`
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
