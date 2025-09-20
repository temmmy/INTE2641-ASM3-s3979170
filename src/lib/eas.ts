import { decodeAbiParameters } from "viem";
import { readContract } from "wagmi/actions";
import { sepolia } from "wagmi/chains";

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

export async function readAttestation(uid: `0x${string}`): Promise<EasAttestation | null> {
  const result = (await readContract(wagmiConfig, {
    address: env.easAddress,
    abi: easAbi,
    functionName: "getAttestation",
    args: [uid],
    chainId: sepolia.id,
  })) as unknown as RawAttestation;

  const [attUid] = result;
  if (attUid === ZERO_BYTES32) {
    return null;
  }

  return {
    uid: result[0],
    schema: result[1],
    time: result[2],
    expirationTime: result[3],
    revocationTime: result[4],
    refUID: result[5],
    recipient: result[6],
    attester: result[7],
    revocable: result[8],
    data: result[9],
  };
}

export type DecodedTaskAttestation = {
  taskId: bigint;
  qualityScore: number;
  comment: string;
  worker: `0x${string}`;
  client: `0x${string}`;
};

export function decodeTaskAttestation(data: `0x${string}`): DecodedTaskAttestation | null {
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
  return attestation.expirationTime !== BigInt(0) && attestation.expirationTime < BigInt(Math.floor(Date.now() / 1000));
}

export function isRevoked(attestation: EasAttestation): boolean {
  return attestation.revocationTime !== BigInt(0);
}

type RawAttestation = readonly [
  `0x${string}`,
  `0x${string}`,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
  `0x${string}`,
  `0x${string}`,
  boolean,
  `0x${string}`
];
