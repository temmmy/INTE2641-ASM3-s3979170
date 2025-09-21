"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { env } from "@/lib/env";
import {
  readTask,
  submitWork,
  releasePayment,
  refund,
  waitForTx,
  getErc20Decimals,
} from "@/lib/task-service";
import { useToast } from "@/lib/toast";
import { ZERO_ADDRESS } from "@/lib/constants";
import { recordTask } from "@/lib/local-tasks";
import type { Task } from "@/types/task";
import { TaskStatus } from "@/types/task";
import {
  readAttestation,
  decodeTaskAttestation,
  isExpired,
  isRevoked,
} from "@/lib/eas";
import {
  AttestationPreview,
  type AttestationCheck,
} from "@/components/attestation-preview";

const statusMeta: Record<
  TaskStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [TaskStatus.Open]: { label: "Open", variant: "secondary" },
  [TaskStatus.Submitted]: { label: "Submitted", variant: "outline" },
  [TaskStatus.Paid]: { label: "Paid", variant: "default" },
  [TaskStatus.Refunded]: { label: "Refunded", variant: "secondary" },
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [workUri, setWorkUri] = useState("");
  const [attestationUid, setAttestationUid] = useState("");
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const taskId = useMemo(() => {
    try {
      return params?.id ? BigInt(params.id) : null;
    } catch {
      return null;
    }
  }, [params]);

  const taskQuery = useQuery({
    queryKey: ["task", taskId?.toString() ?? ""],
    queryFn: async () => {
      if (taskId == null) throw new Error("Invalid task id");
      return await readTask(taskId);
    },
    enabled: taskId != null && isConnected,
    refetchInterval: 10_000,
  });

  const taskData = taskQuery.data as Task | undefined;

  const isAttestationUidFormatValid = /^0x[a-fA-F0-9]{64}$/.test(
    attestationUid
  );

  const attestationQuery = useQuery({
    queryKey: ["attestation", attestationUid],
    queryFn: () => readAttestation(attestationUid as `0x${string}`),
    enabled:
      Boolean(attestationUid) && isAttestationUidFormatValid && isConnected,
    staleTime: 15_000,
  });

  const attestationChecks: AttestationCheck[] = useMemo(() => {
    const checks: AttestationCheck[] = [];

    if (!attestationUid) return checks;

    if (!isAttestationUidFormatValid) {
      checks.push({
        label: "UID format",
        pass: false,
        hint: "Must be 0x followed by 64 hex characters",
      });
      return checks;
    }

    const attestation = attestationQuery.data;
    if (!attestation || !taskData) {
      checks.push({
        label: "Attestation exists",
        pass: false,
        hint: attestationQuery.isFetching
          ? "Checking attestation"
          : "Not found on-chain",
      });
      return checks;
    }
    const currentTask = taskData;
    checks.push({
      label: "Schema matches",
      pass: attestation.schema === env.schemaUid,
    });
    checks.push({
      label: "Attestor matches",
      pass:
        attestation.attester.toLowerCase() ===
        currentTask.attestor.toLowerCase(),
    });
    checks.push({
      label: "Recipient matches worker",
      pass:
        attestation.recipient.toLowerCase() ===
        currentTask.worker.toLowerCase(),
    });
    checks.push({ label: "Not revoked", pass: !isRevoked(attestation) });
    checks.push({ label: "Not expired", pass: !isExpired(attestation) });

    const decoded = decodeTaskAttestation(attestation.data);
    if (decoded) {
      checks.push({
        label: "taskId matches",
        pass: decoded.taskId === currentTask.id,
      });
      checks.push({
        label: "client matches",
        pass: decoded.client.toLowerCase() === currentTask.client.toLowerCase(),
      });
      checks.push({
        label: "worker matches",
        pass: decoded.worker.toLowerCase() === currentTask.worker.toLowerCase(),
      });
    } else {
      checks.push({
        label: "Payload decodes",
        pass: false,
        hint: "Unexpected attestation schema",
      });
    }

    return checks;
  }, [
    attestationUid,
    attestationQuery.data,
    attestationQuery.isFetching,
    isAttestationUidFormatValid,
    taskData,
  ]);

  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  useEffect(() => {
    let active = true;
    async function loadDecimals() {
      if (!taskData || !taskData.token || taskData.token === ZERO_ADDRESS) {
        setTokenDecimals(18);
        return;
      }
      try {
        const fetched = await getErc20Decimals(taskData.token);
        if (active) setTokenDecimals(fetched);
      } catch (error) {
        console.warn("Failed to load token decimals", error);
        if (active) setTokenDecimals(18);
      }
    }
    loadDecimals();
    return () => {
      active = false;
    };
  }, [taskData?.token, taskData]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect your wallet</CardTitle>
          <CardDescription>
            Connect your wallet to interact with tasks.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (taskQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading task…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!taskData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task not found</CardTitle>
          <CardDescription>Check the URL or create a new task.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const amountFormatted = formatUnits(taskData.amount, tokenDecimals);
  const deadlineDate = new Date(taskData.deadline * 1000);
  const isClient = address?.toLowerCase() === taskData.client.toLowerCase();
  const isWorker = address?.toLowerCase() === taskData.worker.toLowerCase();
  const isAttestor = address?.toLowerCase() === taskData.attestor.toLowerCase();

  async function handleSubmitWork(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskId || !taskData) return;
    if (!workUri) {
      notify({ title: "Work URI required", variant: "error" });
      return;
    }

    try {
      setIsSubmittingWork(true);
      notify({
        title: "Submitting work",
        description: "Confirm the transaction in your wallet.",
      });
      const txHash = await submitWork({ id: taskId, workUri });
      await waitForTx(txHash);
      recordTask({
        id: taskId.toString(),
        role: "worker",
        address: taskData.worker,
        chainId: env.chainId,
        createdAt: Date.now(),
      });
      setWorkUri("");
      await queryClient.invalidateQueries({
        queryKey: ["task", taskId.toString()],
      });
      notify({ title: "Work submitted", variant: "success" });
    } catch (error) {
      console.error(error);
      notify({
        title: "Failed to submit work",
        description:
          error instanceof Error ? error.message : "Unexpected error",
        variant: "error",
      });
    } finally {
      setIsSubmittingWork(false);
    }
  }

  async function handleReleasePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskId || !taskData) return;
    if (!attestationUid) {
      notify({ title: "Attestation UID required", variant: "error" });
      return;
    }

    try {
      setIsReleasing(true);
      notify({
        title: "Releasing payment",
        description: "Validating attestation on-chain.",
      });
      const txHash = await releasePayment({
        id: taskId,
        attestationUid: attestationUid as `0x${string}`,
      });
      await waitForTx(txHash);
      await queryClient.invalidateQueries({
        queryKey: ["task", taskId.toString()],
      });
      notify({ title: "Payment released", variant: "success" });
      setAttestationUid("");
    } catch (error) {
      console.error(error);
      notify({
        title: "Failed to release payment",
        description:
          error instanceof Error ? error.message : "Unexpected error",
        variant: "error",
      });
    } finally {
      setIsReleasing(false);
    }
  }

  async function handleRefund() {
    if (!taskId) return;

    try {
      setIsRefunding(true);
      notify({
        title: "Refunding",
        description: "Confirm the refund transaction.",
      });
      const txHash = await refund(taskId);
      await waitForTx(txHash);
      await queryClient.invalidateQueries({
        queryKey: ["task", taskId.toString()],
      });
      notify({ title: "Refund complete", variant: "success" });
    } catch (error) {
      console.error(error);
      notify({
        title: "Failed to refund",
        description:
          error instanceof Error ? error.message : "Unexpected error",
        variant: "error",
      });
    } finally {
      setIsRefunding(false);
    }
  }

  const status = statusMeta[taskData.status];
  const canSubmitWork = isWorker && taskData.status === TaskStatus.Open;
  const canRelease =
    (isAttestor || isClient) && taskData.status === TaskStatus.Submitted;
  const canRefund =
    isClient &&
    taskData.status !== TaskStatus.Paid &&
    Date.now() / 1000 > taskData.deadline;
  const releaseBlocked =
    !attestationUid || attestationChecks.some((check) => !check.pass);

  return (
    <div className="space-y-10">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Task #{taskData.id.toString()}</CardTitle>
            <CardDescription>
              Client escrow: {shorten(taskData.client)} · Worker:{" "}
              {shorten(taskData.worker)} · Attestor:{" "}
              {shorten(taskData.attestor)}
            </CardDescription>
          </div>
          <Badge variant={status?.variant ?? "secondary"}>
            {status?.label ?? "Unknown"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow
              label="Funding token"
              value={taskData.token ? shorten(taskData.token) : "ETH"}
            />
            <InfoRow
              label="Amount"
              value={`${amountFormatted} ${taskData.token ? "ERC-20" : "ETH"}`}
            />
            <InfoRow
              label="Deadline"
              value={`${deadlineDate.toLocaleString()}`}
            />
            <InfoRow
              label="Work URI"
              value={taskData.workUri ?? "Not submitted"}
            />
            <InfoRow
              label="Attestation UID"
              value={taskData.attestationUid ?? "Pending"}
            />
          </div>
        </CardContent>
      </Card>

      {canSubmitWork ? (
        <Card>
          <CardHeader>
            <CardTitle>Submit work</CardTitle>
            <CardDescription>
              Share a link or CID pointing to the completed deliverables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workUri">
                  Work reference <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="workUri"
                  value={workUri}
                  onChange={(event) => setWorkUri(event.target.value)}
                  placeholder="https://... or ipfs://..."
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmittingWork}
                aria-busy={isSubmittingWork}
              >
                {isSubmittingWork ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Submitting…
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {canRelease ? (
        <Card>
          <CardHeader>
            <CardTitle>Release payment</CardTitle>
            <CardDescription>
              Paste the attestation UID fetched from the official EAS tools to
              unlock this escrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleReleasePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="attestation">
                  Attestation UID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="attestation"
                  value={attestationUid}
                  onChange={(event) => setAttestationUid(event.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <AttestationPreview
                uid={attestationUid}
                checks={attestationChecks}
                isLoading={attestationQuery.isFetching}
              />
              {releaseBlocked && attestationUid ? (
                <p className="text-xs text-destructive/80">
                  Resolve the failing checks above before releasing payment.
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={isReleasing || releaseBlocked}
                aria-busy={isReleasing}
              >
                {isReleasing ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Releasing…
                  </span>
                ) : releaseBlocked ? (
                  "Resolve checks first"
                ) : (
                  "Release payment"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {canRefund ? (
        <Card>
          <CardHeader>
            <CardTitle>Refund escrow</CardTitle>
            <CardDescription>
              Return the funds to the client because the deadline has passed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={isRefunding}
              aria-busy={isRefunding}
            >
              {isRefunding ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Refunding…
                </span>
              ) : (
                "Refund"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      <div className="grid gap-3 text-sm">
        <InfoRow label="Client" value={taskData.client} />
        <InfoRow label="Worker" value={taskData.worker} />
        <InfoRow label="Attestor" value={taskData.attestor} />
        <InfoRow label="Escrow contract" value={env.escrowAddress} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-medium text-foreground break-all">{value}</span>
    </div>
  );
}

function shorten(value: string) {
  if (!value) return "";
  return value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}
