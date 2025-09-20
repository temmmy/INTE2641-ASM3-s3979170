import * as hre from "hardhat";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.join(__dirname, "..", "deployments");

const { EAS_ADDRESS, TASK_COMPLETED_SCHEMA_UID } = process.env;

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

  const factory = await ethers.getContractFactory("AgeEscrow");
  const contract = await factory.deploy(EAS_ADDRESS, TASK_COMPLETED_SCHEMA_UID);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deploymentTx = contract.deploymentTransaction();
  const receipt = deploymentTx ? await deploymentTx.wait() : undefined;
  const chainId = (await deployer.provider?.getNetwork())?.chainId;

  let blockTimestamp: number | null = null;
  if (receipt?.blockHash) {
    const block = await deployer.provider?.getBlock(receipt.blockHash);
    blockTimestamp = block?.timestamp ?? null;
  }

  console.log(`AgeEscrow deployed to: ${address}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = path.join(
    OUTPUT_DIR,
    `${network.name}-age-escrow.json`
  );

  writeFileSync(
    filePath,
    JSON.stringify(
      {
        address,
        chainId: chainId?.toString() ?? null,
        deployer: deployer.address,
        easAddress: EAS_ADDRESS,
        taskCompletedSchemaUid: TASK_COMPLETED_SCHEMA_UID,
        transactionHash: deploymentTx?.hash ?? null,
        blockNumber: receipt?.blockNumber ?? null,
        timestamp: blockTimestamp,
      },
      null,
      2
    )
  );

  console.log(`Deployment details saved to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
