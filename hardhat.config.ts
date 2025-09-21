import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const { BASE_SEPOLIA_RPC_URL, BASE_SEPOLIA_PRIVATE_KEY } = process.env;

const networks: HardhatUserConfig["networks"] = {};

if (BASE_SEPOLIA_RPC_URL) {
  networks!.baseSepolia = {
    url: BASE_SEPOLIA_RPC_URL,
    chainId: 84532,
    accounts: BASE_SEPOLIA_PRIVATE_KEY ? [BASE_SEPOLIA_PRIVATE_KEY] : undefined,
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
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
