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
  const mtFactory = await ethers.getContractFactory("MyTokenMock");
  const mt = await mtFactory.deploy("AAAAA", "A5");
  console.log(`mock erc20 deployed: ${mt.address}`);

  const args = mtFactory.interface.encodeDeploy(["Coq Chain Token", "COQ"]);
  // console.log(args);
  // sleep 10s
  await Sleep(10000);
  switch (network.name) {
    case "coq":
      console.log(
        `MyTokenMock(${
          mt.address
        }) verify & push contract, guid: ${await VerifyContractBlockScout(
          mt.address,
          "contracts/mock/MyToken.sol:MyTokenMock",
          args.slice(2),
          "https://testnetscan.ankr.com/api"
        )}`
      );
      break;
    case "bsctest":
      console.log(
        `MyToken(${
          mt.address
        }) verify & push contract, guid: ${await VerifyContractEthScan(
          mt.address,
          "contracts/mock/MyToken.sol:MyTokenMock",
          args,
          "https://api-testnet.bscscan.com/api",
          "Z86V9AC619GAGEYVWBP86CTGDDPSS4JS8R"
        )}`
      );
      break;
    case "polygontest":
      console.log(
        `MyToken(${
          mt.address
        }) verify & push contract, guid: ${await VerifyContractEthScan(
          mt.address,
          "contracts/mock/MyToken.sol:MyTokenMock",
          args.slice(2),
          "https://api-testnet.polygonscan.com/api",
          "AETMWJBB9WTFK95EE98W8D3JTBXWGX83SZ"
        )}`
      );
      break;
    case "goerli":
      console.log(
        `MyToken(${
          mt.address
        }) verify & push contract, guid: ${await VerifyContractEthScan(
          mt.address,
          "contracts/mock/MyToken.sol:MyTokenMock",
          args.slice(2),
          "https://api-goerli.etherscan.io/api",
          "ASQ5WCMDEBHF6XZI5R9UFM39WERSB3KSS6"
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
