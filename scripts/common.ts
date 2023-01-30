import { network } from "hardhat";

function getVerifyUrl(): string {
  switch (network.name) {
    case "bsctest":
      return "https://api-testnet.bscscan.com/api";
    case "bscmain":
      return "https://api.bscscan.com/api";
    case "coq":
      return "https://api.etherscan.io/api";
    case "goerli":
      return "https://api-goerli.etherscan.io/api";
  }
  return "";
}

function getVerifyApiKey(): string {
  switch (network.name) {
    case "bscmain":
      return process.env.BSCSCAN_API_KEY || "";
    case "bsctest":
      return process.env.BSCSCAN_API_KEY || "";
    case "ethmain":
      return process.env.ETHERSCAN_API_KEY || "";
    case "goerli":
      return process.env.ETHERSCAN_API_KEY || "";
  }
  return "";
}

export const Sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
