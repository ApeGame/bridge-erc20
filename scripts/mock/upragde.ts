// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { VerifyContractBlockScout } from "../common-blockscout";
import { VerifyContractEthScan } from "../common-ethscan";
import { Sleep } from "../common";
import { ethers, upgrades, network } from "hardhat";

let bridgeContract;
async function main() {
  switch (network.name) {
    case "coq":
      bridgeContract = "0xB6103AaCFa6A6d53b4224F8f17F1a74d7c3411b5";
      break;
    case "bsctest":
      bridgeContract = "0xe99871132bDC1c8306556f2B23FCE261575d18B3";
      break;
    default:
      return;
  }

  // 4、deploy bridge contract
  const BridgeFactory = await ethers.getContractFactory("Bridge");

  const newContract = await upgrades.upgradeProxy(
    bridgeContract,
    BridgeFactory
  );
  console.log(`upgrade bridge contract: ${newContract.address}`);

  // sleep 10s
  await Sleep(10000);

  const bridgeLogicContract = await upgrades.erc1967.getImplementationAddress(
    newContract.address
  );
  if (network.name === "bsctest") {
    const baseUrl: string = "https://api-testnet.bscscan.com/api";
    const apikey: string = "Z86V9AC619GAGEYVWBP86CTGDDPSS4JS8R";
    console.log(
      `bridge(${bridgeLogicContract}) verify & push contract, guid: ${await VerifyContractEthScan(
        bridgeLogicContract,
        "contracts/Bridge.sol:Bridge",
        "",
        baseUrl,
        apikey
      )}`
    );
  }

  if (network.name === "coq") {
    const baseUrl: string = "https://testnetscan.ankr.com/api";
    console.log(
      `bridge(${bridgeLogicContract}) verify & push contract, guid: ${await VerifyContractBlockScout(
        bridgeLogicContract,
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
