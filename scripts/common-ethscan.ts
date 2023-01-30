import { artifacts } from "hardhat";
import axios from "axios";
import qs = require("qs");

const licenseType: number = 3; // MIT

export function isExistsEthScan(contract: string, baseUrl: string, apikey:string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    axios
      .request({
        baseURL: baseUrl,
        method: "get",
        params: {
          module: "contract",
          action: "getabi",
          address: contract,
          apikey: apikey,
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

export async function VerifyContractEthScan(
  contract: string,
  contractname: string,
  constructorArguements: string,
  baseUrl: string,
  apikey: string
): Promise<string | undefined> {
  const buildInfo = await artifacts.getBuildInfo(contractname);
  if (buildInfo === undefined) {
    return undefined;
  }

  const data = qs.stringify({
    module: "contract",
    action: "verifysourcecode",
    contractaddress: contract,
    apikey: apikey,
    codeformat: "solidity-standard-json-input",
    contractname: contractname,
    compilerversion: "v" + buildInfo.solcLongVersion, // v0.8.4+commit.c7e474f2
    optimizationUsed: buildInfo.input.settings.optimizer.enabled,
    runs: buildInfo.input.settings.optimizer.runs,
    constructorArguements: constructorArguements,
    licenseType: licenseType,
    sourceCode: JSON.stringify(buildInfo.input),
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
      .catch(function () {
        resolve("verify & push contract failed");
      });
  });
}

export function VerifyProxyEthScan(
  proxyContract: string,
  implementation: string,
  baseUrl: string,
  apikey: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    axios
      .request({
        baseURL: baseUrl,
        method: "post",
        params: {
          module: "contract",
          action: "verifyproxycontract",
          apikey: apikey,
        },
        data: `address=${proxyContract}&expectedimplementation=${implementation}`,
      })
      .then(function (respdata) {
        resolve(respdata.data.result);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}
