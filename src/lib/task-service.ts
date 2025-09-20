"use client";

import { getAccount, readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { sepolia } from "wagmi/chains";
import { erc20Abi } from "viem";

import { wagmiConfig } from "@/lib/wagmi";
import { contracts } from "@/lib/contracts";
import { ETH_TOKEN_PLACEHOLDER, ZERO_ADDRESS, ZERO_BYTES32 } from "@/lib/constants";
import type {
  CreateTaskInput,
  SubmitWorkInput,
  ReleasePaymentInput,
  Task,
  Address,
} from "@/types/task";
import { TaskStatus } from "@/types/task";

const ageEscrow = contracts.ageEscrow;

export async function createTask(input: CreateTaskInput) {
  return await writeContract(wagmiConfig, {
    address: ageEscrow.address,
    abi: ageEscrow.abi,
    functionName: "createTask",
    args: [
      input.id,
      input.worker,
      input.attestor,
      input.token ?? ETH_TOKEN_PLACEHOLDER,
      input.amount,
      BigInt(input.deadline),
    ],
    chainId: sepolia.id,
  });
}

export async function fundTask(taskId: bigint, token: Address | null, amount: bigint) {
  return await writeContract(wagmiConfig, {
    address: ageEscrow.address,
    abi: ageEscrow.abi,
    functionName: "fundTask",
    args: [taskId],
    chainId: sepolia.id,
    value: token ? undefined : amount,
  });
}

export async function submitWork(input: SubmitWorkInput) {
  return await writeContract(wagmiConfig, {
    address: ageEscrow.address,
    abi: ageEscrow.abi,
    functionName: "submitWork",
    args: [input.id, input.workUri],
    chainId: sepolia.id,
  });
}

export async function releasePayment(input: ReleasePaymentInput) {
  return await writeContract(wagmiConfig, {
    address: ageEscrow.address,
    abi: ageEscrow.abi,
    functionName: "releasePayment",
    args: [input.id, input.attestationUid],
    chainId: sepolia.id,
  });
}

export async function refund(taskId: bigint) {
  return await writeContract(wagmiConfig, {
    address: ageEscrow.address,
    abi: ageEscrow.abi,
    functionName: "refund",
    args: [taskId],
    chainId: sepolia.id,
  });
}

type RawTaskStruct = readonly [
  Address,
  Address,
  Address,
  Address,
  bigint,
  bigint,
  number,
  string,
  `0x${string}`
];

export async function readTask(id: bigint): Promise<Task | null> {
  const raw = (await readContract(wagmiConfig, {
    address: ageEscrow.address,
    abi: ageEscrow.abi,
    functionName: "tasks",
    args: [id],
    chainId: sepolia.id,
  })) as RawTaskStruct;

  const [client, worker, attestor, token, amount, deadline, status, workUri, attestationUid] = raw;

  if (client === ZERO_ADDRESS) {
    return null;
  }

  return {
    id,
    client,
    worker,
    attestor,
    token: token === ZERO_ADDRESS ? null : token,
    amount,
    deadline: Number(deadline),
    status: status as TaskStatus,
    workUri: workUri || undefined,
    attestationUid: attestationUid === ZERO_BYTES32 ? undefined : attestationUid,
  };
}

export async function waitForTx(hash: `0x${string}`) {
  return await waitForTransactionReceipt(wagmiConfig, { hash, chainId: sepolia.id });
}

export async function getConnectedAddress(): Promise<Address> {
  const account = await getAccount(wagmiConfig);
  if (!account || !account.address) {
    throw new Error("Wallet not connected");
  }
  return account.address as Address;
}

export async function getErc20Decimals(token: Address): Promise<number> {
  const decimals = await readContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: sepolia.id,
  });
  return Number(decimals);
}

export async function getErc20Allowance(token: Address, owner: Address, spender: Address): Promise<bigint> {
  return await readContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
    chainId: sepolia.id,
  });
}

export async function approveErc20(token: Address, amount: bigint) {
  return await writeContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [ageEscrow.address, amount],
    chainId: sepolia.id,
  });
}
