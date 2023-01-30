// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { VerifyContractEthScan, VerifyProxyEthScan } from "../common-ethscan";
import { Sleep } from "../common";
import { ethers, upgrades } from "hardhat";

const baseUrl: string = "https://api-testnet.bscscan.com/api";
const apikey: string = "Z86V9AC619GAGEYVWBP86CTGDDPSS4JS8R";

const feeReceiver = "0x20cD8eB93c50BDAc35d6A526f499c0104958e3F6";
const pubKey = "0xd6a5914E2b8676bD8Fd2fcD9c0fD1FCf1B5A9411";

async function main() {
  const owner = (await ethers.getSigners())[0];

  // 1、 deploy erc20 token
  const mtFactory = await ethers.getContractFactory("MyTokenMock");
  const mt = await mtFactory.deploy();
  console.log(`mock erc20 deployed: ${mt.address}`);

  // 2、 mint to owner
  mt.mintTo(owner.address, ethers.utils.parseEther("10000"));

  // 3、deploy native token mgr contract
  const NativeTokenMgrFactory = await ethers.getContractFactory(
    "NativeTokenMgr"
  );
  const NativeTokenMgrProxy = await upgrades.deployProxy(
    NativeTokenMgrFactory,
    [],
    {
      initializer: "initialize",
    }
  );
  await NativeTokenMgrProxy.deployed();

  // 4、deploy bridge contract
  const BridgeFactory = await ethers.getContractFactory("Bridge");
  const BridgeProxy = await upgrades.deployProxy(
    BridgeFactory,
    [feeReceiver, NativeTokenMgrProxy.address, pubKey],
    {
      initializer: "initialize",
    }
  );
  await BridgeProxy.deployed();
  console.log(`bridge deployed: ${BridgeProxy.address}`);

  // 5、native token mgr set amin
  let tx = await NativeTokenMgrProxy.setAdmin(BridgeProxy.address, true);
  await tx.wait();

  // 5、set min max burn
  tx = await BridgeProxy.setMinBurn(
    [mt.address],
    [ethers.utils.parseEther("0.1")]
  );
  await tx.wait();

  tx = await BridgeProxy.setMaxBurn(
    [mt.address],
    [ethers.utils.parseEther("100")]
  );
  await tx.wait();

  // 6、add liquidity
  tx = await mt.approve(BridgeProxy.address, ethers.utils.parseEther("9000"));
  await tx.wait();
  tx = await BridgeProxy.addLiquidity(
    mt.address,
    ethers.utils.parseEther("9000")
  );
  await tx.wait();

  // sleep 10s
  await Sleep(10000);

  // 7、 verify contract
  console.log(
    `MyTokenMock(${
      mt.address
    }) verify & push contract, guid: ${await VerifyContractEthScan(
      mt.address,
      "contracts/mock/MyToken.sol:MyTokenMock",
      "",
      baseUrl,
      apikey
    )}`
  );

  const nativeTokenMgrLogicContract =
    await upgrades.erc1967.getImplementationAddress(
      NativeTokenMgrProxy.address
    );

  const bridgeLogicContract = await upgrades.erc1967.getImplementationAddress(
    BridgeProxy.address
  );

  console.log(
    `NativeTokenMgr(${nativeTokenMgrLogicContract}) verify & push contract, guid: ${await VerifyContractEthScan(
      nativeTokenMgrLogicContract,
      "contracts/NativeTokenMgr.sol:NativeTokenMgr",
      "",
      baseUrl,
      apikey
    )}`
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
    NativeTokenMgrProxy.address,
    nativeTokenMgrLogicContract,
    baseUrl,
    apikey
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
