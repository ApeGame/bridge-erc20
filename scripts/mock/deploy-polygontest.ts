// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { VerifyContractEthScan, VerifyProxyEthScan } from "../common-ethscan";
import { Sleep } from "../common";
import { ethers, upgrades } from "hardhat";

const baseUrl: string = "https://api-testnet.polygonscan.com/api";
const apikey: string = "AETMWJBB9WTFK95EE98W8D3JTBXWGX83SZ";

const feeReceiver = "0x20cD8eB93c50BDAc35d6A526f499c0104958e3F6";
const pubKey = "0xd6a5914E2b8676bD8Fd2fcD9c0fD1FCf1B5A9411";

async function main() {
  const owner = (await ethers.getSigners())[0];

  // 1、 deploy erc20 token
  const mtFactory = await ethers.getContractFactory("MyTokenMock");
  const mt = await mtFactory.deploy("My Token", "MYT");
  console.log(`mock erc20 deployed: ${mt.address}`);

  // // 2、 mint to owner
  mt.mintTo(owner.address, ethers.utils.parseEther("9000000"));

  // 3、deploy bridge contract
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
    [mt.address],
    [ethers.utils.parseEther("10")]
  );
  await tx.wait();

  tx = await BridgeProxy.setMaxBurn(
    [mt.address],
    [ethers.utils.parseEther("100")]
  );
  await tx.wait();

  // 5、add liquidity
  tx = await mt.approve(
    BridgeProxy.address,
    ethers.utils.parseEther("9000000")
  );
  await tx.wait();
  tx = await BridgeProxy.addLiquidity(
    mt.address,
    ethers.utils.parseEther("9000000")
  );
  await tx.wait();

  // sleep 10s
  await Sleep(10000);

  // 6、 verify contract
  console.log(
    `MyTokenMock(${
      mt.address
    }) verify & push contract, guid: ${await VerifyContractEthScan(
      mt.address,
      "contracts/mock/MyToken.sol:MyTokenMock",
      mt.interface.encodeDeploy(["My Token", "MYT"]).slice(2),
      baseUrl,
      apikey
    )}`
  );

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
