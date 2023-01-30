import { artifacts } from "hardhat";
import axios from "axios";
import qs = require("qs");

const licenseType: number = 3; // MIT

export function isExistsBlockScout(contract: string, baseUrl: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    axios
      .request({
        baseURL: baseUrl,
        method: "get",
        params: {
          module: "contract",
          action: "getabi",
          address: contract,
        },
      })
      .then(function (respdata) {
        if (respdata.data.message === "OK") {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(function () {
        resolve(false);
      });
  });
}

export async function VerifyContractBlockScout(
  contract: string,
  contractname: string,
  constructorArguements: string,
  baseUrl: string
): Promise<string | undefined> {
  const buildInfo = await artifacts.getBuildInfo(contractname);
  if (buildInfo === undefined) {
    return undefined;
  }
  const data = qs.stringify({
    module: "contract",
    action: "verifysourcecode",
    contractaddress: contract,
    codeformat: "solidity-standard-json-input",
    contractname: contractname,
    compilerversion: "v" + buildInfo.solcLongVersion, // v0.8.4+commit.c7e474f2
    sourceCode: JSON.stringify(buildInfo.input),
    constructorArguements: constructorArguements,
  });
  return new Promise((resolve, reject) => {
    axios
      .request({
        baseURL: baseUrl,
        method: "post",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: data,
      })
      .then(function (resp) {
        if (resp.data.message === "OK") {
          resolve(resp.data.result);
        } else {
          resolve(`verify & push contract failed: ${resp.data.result}`);
        }
      })
      .catch(function (err) {
        resolve(`verify & push contract failed: ${err}`);
      });
  });
}
