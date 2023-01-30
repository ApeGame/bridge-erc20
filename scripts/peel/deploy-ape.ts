import { constants } from "ethers";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { VerifyContractBlockScout } from "../common-blockscout";
import { Sleep } from "../common";
import { ethers, upgrades } from "hardhat";

const baseUrl: string = "https://explorer.bas.metaapesgame.com/api";

const pubKey = "0x5767A8EdE4d14595162920C4019a5e79D685FF67";

async function main() {
  const feeReceiver = (await ethers.getSigners())[0].address;

  // 1、deploy native token mgr contract
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

  // 2、deploy bridge contract
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

  // 3、native token mgr set admin
  let tx = await NativeTokenMgrProxy.setAdmin(BridgeProxy.address, true);
  await tx.wait();

  // 4、set min max burn
  tx = await BridgeProxy.setMinBurn(
    [constants.AddressZero],
    [ethers.utils.parseEther("50")]
  );
  await tx.wait();

  tx = await BridgeProxy.setMaxBurn(
    [constants.AddressZero],
    [ethers.utils.parseEther("1000")]
  );
  await tx.wait();

  // 5、add liquidity
  // tx = BridgeProxy.addNativeLiquidity({
  //   value: ethers.utils.parseEther("200000"),
  // });
  // await tx.wait();

  // sleep 10s
  await Sleep(10000);

  // 6、 verify contract
  const nativeTokenMgrLogicContract =
    await upgrades.erc1967.getImplementationAddress(
      NativeTokenMgrProxy.address
    );

  const bridgeLogicContract = await upgrades.erc1967.getImplementationAddress(
    BridgeProxy.address
  );

  console.log(
    `NativeTokenMgr(${nativeTokenMgrLogicContract}) verify & push contract, guid: ${await VerifyContractBlockScout(
      nativeTokenMgrLogicContract,
      "contracts/NativeTokenMgr.sol:NativeTokenMgr",
      "",
      baseUrl
    )}`
  );

  console.log(
    `bridge(${bridgeLogicContract}) verify & push contract, guid: ${await VerifyContractBlockScout(
      bridgeLogicContract,
      "contracts/Bridge.sol:Bridge",
      "",
      baseUrl
    )}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
