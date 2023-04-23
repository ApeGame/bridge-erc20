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
    case "eth":
      bridgeContract = "0x261a69E6315b95D9ef824b72D983F8089f982F17";
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

  if (network.name === "eth") {
    const baseUrl: string = "https://api.etherscan.io/api";
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
