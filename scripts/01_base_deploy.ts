import * as hre from "hardhat";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.join(__dirname, "..", "deployments");

const EAS_ADDRESS = process.env.EAS_ADDRESS || "0x4200000000000000000000000000000000000021";
const TASK_COMPLETED_SCHEMA_UID = process.env.TASK_COMPLETED_SCHEMA_UID || "0x8c1564efc1c47e9d05a0b5a03889a5ea98160efcb14cf8468980b7b20f0bb72d";

async function main() {
  if (!EAS_ADDRESS) {
    throw new Error("EAS_ADDRESS environment variable is required");
  }

  if (!TASK_COMPLETED_SCHEMA_UID) {
    throw new Error("TASK_COMPLETED_SCHEMA_UID environment variable is required");
  }

  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();

  console.log(`Network: ${network.name}`);
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`EAS Address: ${EAS_ADDRESS}`);
  console.log(`Schema UID: ${TASK_COMPLETED_SCHEMA_UID}`);

  const factory = await ethers.getContractFactory("AgeEscrow");
  const contract = await factory.deploy(EAS_ADDRESS, TASK_COMPLETED_SCHEMA_UID);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deploymentTx = contract.deploymentTransaction();
  const receipt = deploymentTx ? await deploymentTx.wait() : undefined;
  const chainId = (await deployer.provider?.getNetwork())?.chainId;

  let blockTimestamp = null;
  if (receipt?.blockHash) {
    const block = await deployer.provider?.getBlock(receipt.blockHash);
    blockTimestamp = block?.timestamp ?? null;
  }

  console.log(`AgeEscrow deployed to: ${address}`);
  console.log(`Transaction hash: ${deploymentTx?.hash}`);
  console.log(`Block number: ${receipt?.blockNumber}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = path.join(
    OUTPUT_DIR,
    `${network.name}-age-escrow.json`
  );

  const deploymentData = {
    address,
    chainId: chainId?.toString() ?? null,
    deployer: deployer.address,
    easAddress: EAS_ADDRESS,
    taskCompletedSchemaUid: TASK_COMPLETED_SCHEMA_UID,
    transactionHash: deploymentTx?.hash ?? null,
    blockNumber: receipt?.blockNumber ?? null,
    timestamp: blockTimestamp,
  };

  writeFileSync(
    filePath,
    JSON.stringify(deploymentData, null, 2)
  );

  console.log(`Deployment details saved to ${filePath}`);
  console.log(`\nContract Address: ${address}`);
  console.log(`Chain ID: ${chainId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});