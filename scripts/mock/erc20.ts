// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { VerifyContract as VerifyContractBlockscout } from "../common-blockscout";
import { VerifyContract as VerifyContractEthscan } from "../common-ethscan";
import { Sleep } from "../common";
import { ethers, network } from "hardhat";


async function main() {
  const mtFactory = await ethers.getContractFactory("MyTokenMock");
  const mt = await mtFactory.deploy();
  console.log(`mock erc20 deployed: ${mt.address}`);

  // sleep 10s
  await Sleep(10000);
  switch (network.name) {
    case "coq":
      console.log(
        `MyTokenMock(${
          mt.address
        }) verify & push contract, guid: ${await VerifyContractBlockscout(
          mt.address,
          "contracts/mock/MyToken.sol:MyTokenMock",
          "",
          "https://testnetscan.ankr.com/api"
        )}`
      );
      break;
    case "bsctest":
      console.log(
        `MyToken(${
          mt.address
        }) verify & push contract, guid: ${await VerifyContractEthscan(
          mt.address,
          "contracts/mock/MyToken.sol:MyTokenMock",
          "",
          "https://api-testnet.bscscan.com/api",
          "Z86V9AC619GAGEYVWBP86CTGDDPSS4JS8R"
        )}`
      );
      break;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
