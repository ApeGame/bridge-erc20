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
      bridgeContract = "0x21a4813D3A13fD762d00FC3551D67553453c5c19";
      break;
    case "bsctest":
      bridgeContract = "0xe494b08DFBd3254780b6171C9939582D8a98056d";
      break;
    case "polygontest":
      bridgeContract = "0x083DDdD02835385A239b710648f33781B15Cc3C0";
      break;
    case "goerli":
      bridgeContract = "0x07dF725eEa755E35aC85281eFDC884c33969e23f";
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

  if (network.name === "polygontest") {
    const baseUrl: string = "https://api-testnet.polygonscan.com/api";
    const apikey: string = "AETMWJBB9WTFK95EE98W8D3JTBXWGX83SZ";
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

  if (network.name === "goerli") {
    const baseUrl: string = "https://api-goerli.etherscan.io/api";
    const apikey: string = "ASQ5WCMDEBHF6XZI5R9UFM39WERSB3KSS6";
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
