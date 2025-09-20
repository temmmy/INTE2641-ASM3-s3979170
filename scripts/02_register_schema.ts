import * as hre from "hardhat";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SCHEMA_DEFINITION = "uint256 taskId,uint8 qualityScore,string comment,address worker,address client";
const OUTPUT_DIR = path.join(__dirname, "..", "deployments");

const { EAS_ADDRESS } = process.env;

async function main() {
  if (!EAS_ADDRESS) {
    throw new Error("EAS_ADDRESS environment variable is required to register the schema");
  }

  const { ethers, network } = hre;
  const [signer] = await ethers.getSigners();

  console.log(`Network: ${network.name}`);
  console.log(`Registering schema with account: ${signer.address}`);

  const eas = new ethers.Contract(
    EAS_ADDRESS,
    ["function getSchemaRegistry() view returns (address)"],
    signer
  );

  const registryAddress: string = await eas.getSchemaRegistry();
  if (!registryAddress || registryAddress === ethers.ZeroAddress) {
    throw new Error("Invalid schema registry address returned by EAS");
  }

  const registry = new ethers.Contract(
    registryAddress,
    [
      "event Registered(bytes32 indexed uid, address indexed registerer, tuple(bytes32 uid,address resolver,bool revocable,string schema) schema)",
      "function register(string schema,address resolver,bool revocable) returns (bytes32)",
      "function getSchema(bytes32 uid) view returns (tuple(bytes32 uid,address resolver,bool revocable,string schema))"
    ],
    signer
  );

  const schemaUid = ethers.solidityPackedKeccak256(
    ["string", "address", "bool"],
    [SCHEMA_DEFINITION, ethers.ZeroAddress, true]
  );

  const existing = await registry.getSchema(schemaUid);
  if (existing && existing.schema && existing.schema !== "") {
    console.log(`Schema already registered with UID: ${schemaUid}`);
  } else {
    const tx = await registry.register(SCHEMA_DEFINITION, ethers.ZeroAddress, true);
    console.log(`Submitted schema registration tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Schema registered in block ${receipt?.blockNumber ?? "unknown"}`);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = path.join(OUTPUT_DIR, `${network.name}-schema.json`);

  writeFileSync(
    filePath,
    JSON.stringify(
      {
        schemaUid,
        schema: SCHEMA_DEFINITION,
        easAddress: EAS_ADDRESS,
        registryAddress,
      },
      null,
      2
    )
  );

  console.log(`Schema details saved to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
