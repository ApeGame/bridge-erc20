// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { VerifyContractEthScan, VerifyProxyEthScan } from "../common-ethscan";
import { Sleep } from "../common";
import { ethers, upgrades } from "hardhat";

const baseUrl: string = "https://api.polygonscan.com/api";
const apikey: string = "AETMWJBB9WTFK95EE98W8D3JTBXWGX83SZ";

const peelContract: string = "0x734548a9e43d2D564600b1B2ed5bE9C2b911c6aB";
const pubKey = "0x76dB25EEbc0E6Ac00A6F171B77e465ABe7c5276E";

async function main() {
  const feeReceiver = (await ethers.getSigners())[0].address;

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
    [ethers.utils.parseEther("20")]
  );
  await tx.wait();

  tx = await BridgeProxy.setMaxBurn(
    [peelContract],
    [ethers.utils.parseEther("1000")]
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
