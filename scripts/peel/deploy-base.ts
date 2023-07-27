// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { VerifyContractEthScan, VerifyProxyEthScan } from "../common-ethscan";
import { Sleep } from "../common";
import { ethers, upgrades } from "hardhat";

const baseUrl: string = "https://api.basescan.org/api";
const apikey: string = "3WGNMRP6F45GDZVQDGEI3DWQDSP4YDJ9JU";

const peelContract: string = "";
const pubKey = "0x5767A8EdE4d14595162920C4019a5e79D685FF67";
const feeReceiver = "0x5767A8EdE4d14595162920C4019a5e79D685FF67";

async function main() {
  // 2、deploy bridge contract
  const BridgeFactory = await ethers.getContractFactory("Bridge");
  const BridgeProxy = await upgrades.deployProxy(
    BridgeFactory,
    [feeReceiver, pubKey],
    {
      initializer: "initialize",
    }
  );
  await BridgeProxy.deployed();
  console.log(`bridge deployed: ${BridgeProxy.address}`);

  // 4、set min max burn
  let tx = await BridgeProxy.setMinBurn(
    [peelContract],
    [ethers.utils.parseEther("100")]
  );
  await tx.wait();

  tx = await BridgeProxy.setMaxBurn(
    [peelContract],
    [ethers.utils.parseEther("5000")]
  );
  await tx.wait();

  // 5、add liquidity
  // tx = await mt.approve(BridgeProxy.address, ethers.utils.parseEther("200000"));
  // await tx.wait();
  // tx = await BridgeProxy.addLiquidity(
  //   mt.address,
  //   ethers.utils.parseEther("200000")
  // );
  // await tx.wait();

  // sleep 10s
  await Sleep(10000);

  // 6、 verify contract

  const bridgeLogicContract = await upgrades.erc1967.getImplementationAddress(
    BridgeProxy.address
  );

  console.log(
    `bridge(${bridgeLogicContract}) verify & push contract, guid: ${await VerifyContractEthScan(
      bridgeLogicContract,
      "contracts/Bridge.sol:Bridge",
      "",
      baseUrl,
      apikey
    )}`
  );

  await VerifyProxyEthScan(
    BridgeProxy.address,
    bridgeLogicContract,
    baseUrl,
    apikey
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});