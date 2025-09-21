"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAddress, parseUnits } from "viem";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { env } from "@/lib/env";
import { contracts } from "@/lib/contracts";
import {
  createTask,
  fundTask,
  getConnectedAddress,
  getErc20Allowance,
  getErc20Decimals,
  approveErc20,
  waitForTx,
} from "@/lib/task-service";
import { recordTask } from "@/lib/local-tasks";
import { useToast } from "@/lib/toast";
import type { Address } from "@/types/task";

export default function NewTaskPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const { notify } = useToast();

  const [worker, setWorker] = useState("");
  const [attestor, setAttestor] = useState("");
  const [tokenMode, setTokenMode] = useState<"eth" | "erc20">("eth");
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState<string>(() => defaultDeadlineInput());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect your wallet</CardTitle>
          <CardDescription>You need to connect a wallet before creating a task escrow.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const workerAddress = normalizeAddress(worker, "Worker address");
      const attestorAddress = normalizeAddress(attestor, "Attestor address");
      const clientAddress = await getConnectedAddress();

      let token: Address | null = null;
      let decimals = 18;

      if (tokenMode === "erc20") {
        token = normalizeAddress(tokenAddress, "Token address");
        decimals = await getErc20Decimals(token);
      }

      if (!amount || Number(amount) <= 0) {
        throw new Error("Amount must be greater than zero");
      }

      const parsedAmount = parseUnits(amount, decimals);

      const deadlineTimestamp = parseDeadline(deadline);

      const taskId = BigInt(Date.now());

      notify({
        title: "Creating task",
        description: "Confirm the task creation transaction in your wallet.",
      });

      const createTxHash = await createTask({
        id: taskId,
        worker: workerAddress,
        attestor: attestorAddress,
        token,
        amount: parsedAmount,
        deadline: deadlineTimestamp,
      });
      await waitForTx(createTxHash);

      if (token) {
        const allowance = await getErc20Allowance(token, clientAddress, contracts.ageEscrow.address as Address);
        if (allowance < parsedAmount) {
          notify({
            title: "Approving token",
            description: "Granting allowance to the escrow contract.",
          });
          const approveTxHash = await approveErc20(token, parsedAmount);
          await waitForTx(approveTxHash);
        }
      }

      notify({
        title: "Funding escrow",
        description: token ? "Confirm the funding transaction." : "Sending ETH to escrow.",
      });

      const fundTxHash = await fundTask(taskId, token, parsedAmount);
      await waitForTx(fundTxHash);

      recordTask({
        id: taskId.toString(),
        role: "client",
        address: clientAddress,
        chainId: env.chainId,
        createdAt: Date.now(),
      });

      notify({
        title: "Task created",
        description: "Your escrow is live and ready for work submission.",
        variant: "success",
      });

      router.push(`/task/${taskId.toString()}`);
    } catch (error) {
      console.error(error);
      notify({
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a task</CardTitle>
        <CardDescription>
          Define the worker, attestor, funding details, and deadline. Funds remain locked until a valid attestation is
          presented.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="worker">
                Worker address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="worker"
                value={worker}
                onChange={(event) => setWorker(event.target.value)}
                placeholder="0x..."
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attestor">
                Attestor address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="attestor"
                value={attestor}
                onChange={(event) => setAttestor(event.target.value)}
                placeholder="0x..."
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Token <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="token"
                    value="eth"
                    checked={tokenMode === "eth"}
                    onChange={() => setTokenMode("eth")}
                  />
                  ETH
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="token"
                    value="erc20"
                    checked={tokenMode === "erc20"}
                    onChange={() => setTokenMode("erc20")}
                  />
                  ERC-20
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="any"
                placeholder={tokenMode === "eth" ? "0.05" : "100"}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
          </div>

          {tokenMode === "erc20" ? (
            <div className="space-y-2">
              <Label htmlFor="tokenAddress">
                Token contract address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tokenAddress"
                placeholder="0x..."
                value={tokenAddress}
                onChange={(event) => setTokenAddress(event.target.value)}
                required
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="deadline">
              Deadline <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              min={defaultDeadlineInput()}
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Task will auto-refund after this deadline if no attestation is provided.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Processing…
              </span>
            ) : (
              "Create & fund"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function normalizeAddress(value: string, label: string): Address {
  if (!isAddress(value)) {
    throw new Error(`${label} is not a valid address`);
  }
  return value as Address;
}

function parseDeadline(input: string): number {
  const timestamp = Math.floor(new Date(input).getTime() / 1000);
  if (!Number.isFinite(timestamp) || timestamp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Deadline must be in the future");
  }
  return timestamp;
}

function defaultDeadlineInput(): string {
  const now = new Date();
  now.setDate(now.getDate() + 3);
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
