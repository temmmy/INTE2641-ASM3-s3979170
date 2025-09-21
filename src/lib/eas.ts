import { decodeAbiParameters } from "viem";
import { readContract } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";

import { wagmiConfig } from "@/lib/wagmi";
import { env } from "@/lib/env";
import { ZERO_BYTES32 } from "@/lib/constants";

const easAbi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "uid",
        type: "bytes32",
      },
    ],
    name: "getAttestation",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "uid", type: "bytes32" },
          { internalType: "bytes32", name: "schema", type: "bytes32" },
          { internalType: "uint64", name: "time", type: "uint64" },
          { internalType: "uint64", name: "expirationTime", type: "uint64" },
          { internalType: "uint64", name: "revocationTime", type: "uint64" },
          { internalType: "bytes32", name: "refUID", type: "bytes32" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "address", name: "attester", type: "address" },
          { internalType: "bool", name: "revocable", type: "bool" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "struct Attestation",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type EasAttestation = {
  uid: `0x${string}`;
  schema: `0x${string}`;
  time: bigint;
  expirationTime: bigint;
  revocationTime: bigint;
  refUID: `0x${string}`;
  recipient: `0x${string}`;
  attester: `0x${string}`;
  revocable: boolean;
  data: `0x${string}`;
};

export async function readAttestation(
  uid: `0x${string}`
): Promise<EasAttestation | null> {
  try {
    console.log("Reading attestation for UID:", uid);
    console.log("EAS Address:", env.easAddress);
    console.log("Chain ID:", baseSepolia.id);

    const result = await readContract(wagmiConfig, {
      address: env.easAddress,
      abi: easAbi,
      functionName: "getAttestation",
      args: [uid],
      chainId: baseSepolia.id,
    });

    console.log("EAS contract call result:", result);
    console.log("Result type:", typeof result);
    console.log("Result is array:", Array.isArray(result));
    console.log("Result properties:", Object.keys(result as any));

    // The result is a tuple object, not an array
    const attestationTuple = result as any;

    console.log("Raw tuple values:");
    console.log("uid:", attestationTuple.uid || attestationTuple[0]);
    console.log("schema:", attestationTuple.schema || attestationTuple[1]);
    console.log("attester:", attestationTuple.attester || attestationTuple[7]);

    // Check if attestation exists by looking at the uid
    const attestationUid = attestationTuple.uid || attestationTuple[0];
    if (!attestationUid || attestationUid === ZERO_BYTES32) {
      console.log("Attestation not found or is zero");
      return null;
    }

    const attestation: EasAttestation = {
      uid: attestationTuple.uid || attestationTuple[0],
      schema: attestationTuple.schema || attestationTuple[1],
      time: attestationTuple.time || attestationTuple[2],
      expirationTime: attestationTuple.expirationTime || attestationTuple[3],
      revocationTime: attestationTuple.revocationTime || attestationTuple[4],
      refUID: attestationTuple.refUID || attestationTuple[5],
      recipient: attestationTuple.recipient || attestationTuple[6],
      attester: attestationTuple.attester || attestationTuple[7],
      revocable:
        attestationTuple.revocable !== undefined
          ? attestationTuple.revocable
          : attestationTuple[8],
      data: attestationTuple.data || attestationTuple[9],
    };

    console.log("Built attestation object:", attestation);
    return attestation;
  } catch (error) {
    console.error("Error reading attestation:", error);
    return null;
  }
}

export type DecodedTaskAttestation = {
  taskId: bigint;
  qualityScore: number;
  comment: string;
  worker: `0x${string}`;
  client: `0x${string}`;
};

export function decodeTaskAttestation(
  data: `0x${string}`
): DecodedTaskAttestation | null {
  if (data === "0x" || data === ZERO_BYTES32) {
    return null;
  }
  try {
    const [taskId, qualityScore, comment, worker, client] = decodeAbiParameters(
      [
        { type: "uint256" },
        { type: "uint8" },
        { type: "string" },
        { type: "address" },
        { type: "address" },
      ] as const,
      data
    );
    return {
      taskId: taskId as bigint,
      qualityScore: Number(qualityScore),
      comment: comment as string,
      worker: worker as `0x${string}`,
      client: client as `0x${string}`,
    };
  } catch (error) {
    console.warn("Failed to decode attestation data", error);
    return null;
  }
}

export function isExpired(attestation: EasAttestation): boolean {
  return (
    attestation.expirationTime !== BigInt(0) &&
    attestation.expirationTime < BigInt(Math.floor(Date.now() / 1000))
  );
}

export function isRevoked(attestation: EasAttestation): boolean {
  return attestation.revocationTime !== undefined;
}
