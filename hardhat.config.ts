import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const { SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY } = process.env;

const networks: HardhatUserConfig["networks"] = {};

if (SEPOLIA_RPC_URL) {
  networks!.sepolia = {
    url: SEPOLIA_RPC_URL,
    accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : undefined,
  };
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks,
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "hardhat-cache",
    artifacts: "hardhat-artifacts",
  },
};

export default config;
