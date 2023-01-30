// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { utils, Wallet } from "ethers";

const bridgeContract = "0x93675aD83DeFDB3377B2f714f1aC7FaE282c3040";
const privateKey =
  "a365344d0151dcdeec97d4d6772999f536a96b44922abe19f99bda5392d2d908";

let req = {
  sender: "0x5fd8b97F8D8DA84813F583C42d40D1e5A4DA9A17",
  receiver: "0x5fd8b97F8D8DA84813F583C42d40D1e5A4DA9A17",
  token: "0x0000000000000000000000000000000000000000",
  amount: utils.parseEther("0.001"),
  fee: 100000,
  refChainId: 12077,
  burnId: "0x9616019b1e2aba8ef8da67fb486d8241ced142b2d8be3fd09079efdc2f2ade6e",
};

async function main() {
  const hash = await sign();
  const bridge = await ethers.getContractAt("Bridge", bridgeContract);
  const tx = await bridge.mintToken(req, hash);
  await tx.wait();
  console.log(`mint token: ${tx.hash}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function sign(): Promise<string> {
  const signer = new Wallet(privateKey, ethers.provider);
  const chainId = await signer.getChainId();

  const msg = utils.solidityKeccak256(
    [
      "address",
      "address",
      "address",
      "uint256",
      "uint256",
      "bytes32",
      "uint256",
      "address",
    ],
    [
      req.sender,
      req.receiver,
      req.token,
      req.amount,
      req.refChainId,
      req.burnId,
      chainId,
      bridgeContract,
    ]
  );

  const signature = utils.splitSignature(signer._signingKey().signDigest(msg));

  return utils.hexlify(
    utils.concat([
      signature.r,
      signature.s,
      signature.recoveryParam ? "0x01" : "0x00",
    ])
  );
}
