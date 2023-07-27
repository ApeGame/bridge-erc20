import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address, await account.getBalance());
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bsctest: {
      url: process.env.BSC_TEST_URL || "",
      accounts:
        process.env.PRIVATE_KEY_TEST !== undefined
          ? [process.env.PRIVATE_KEY_TEST]
          : [],
    },
    coq: {
      url: process.env.COQ_URL || "",
      accounts:
        process.env.PRIVATE_KEY_TEST !== undefined
          ? [process.env.PRIVATE_KEY_TEST]
          : [],
    },
    bsc: {
      url: process.env.BSC_MAIN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    ape: {
      url: process.env.APE_MAIN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: process.env.POLYGON_MAIN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygontest: {
      url: process.env.POLYGON_TEST_URL || "",
      accounts:
        process.env.PRIVATE_KEY_TEST !== undefined
          ? [process.env.PRIVATE_KEY_TEST]
          : [],
    },
    polygontestzkevm: {
      url: process.env.POLYGON_TEST_ZKEVM_URL || "",
      accounts:
        process.env.PRIVATE_KEY_TEST !== undefined
          ? [process.env.PRIVATE_KEY_TEST]
          : [],
    },
    goerli: {
      url: "https://rpc.ankr.com/eth_goerli",
      accounts:
        process.env.PRIVATE_KEY_TEST !== undefined
          ? [process.env.PRIVATE_KEY_TEST]
          : [],
    },
    eth: {
      url: "https://rpc.ankr.com/eth",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    lineatest: {
      url: "https://rpc.goerli.linea.build/",
      chainId: 59140,
      accounts:
        process.env.PRIVATE_KEY_TEST !== undefined
          ? [process.env.PRIVATE_KEY_TEST]
          : [],
    },
    basegoerli: {
      url: "https://goerli.base.org",
      chainId: 84531,
      gasPrice: 1500000000,
      accounts:
        process.env.PRIVATE_KEY_TEST !== undefined
          ? [process.env.PRIVATE_KEY_TEST]
          : [],
    },
    basemainnet: {
      url: "https://developer-access-mainnet.base.org",
      chainId: 8453,
      gasPrice: 100000001,
      accounts:
        process.env.PRIVATE_KEY_TEST !== undefined
          ? [process.env.PRIVATE_KEY_TEST]
          : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      mainnet: "ASQ5WCMDEBHF6XZI5R9UFM39WERSB3KSS6",
      goerli: "ASQ5WCMDEBHF6XZI5R9UFM39WERSB3KSS6",
      polygon: "AETMWJBB9WTFK95EE98W8D3JTBXWGX83SZ",
      polygontestzkevm: "QADPA8U7I9EU4K1I672Y9QHRAY7PFJ5WAX",
      ape: "QADPA8U7I9EU4K1I672Y9QHRAY7PFJ5WAX",
    },
    customChains: [
      {
        network: "polygontestzkevm",
        chainId: 1442,
        urls: {
          apiURL: "https://api-testnet-zkevm.polygonscan.com/api",
          browserURL: "https://testnet-zkevm.polygonscan.com/",
        },
      },
      {
        network: "ape",
        chainId: 16350,
        urls: {
          apiURL: "https://explorer.bas.metaapesgame.com/api",
          browserURL: "https://explorer.bas.metaapesgame.com/",
        },
      },
    ],
  },
};

export default config;
