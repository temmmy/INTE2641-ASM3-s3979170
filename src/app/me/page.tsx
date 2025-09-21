"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useQueries } from "@tanstack/react-query";

import { ClipboardList, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { env } from "@/lib/env";
import { listTasksFor } from "@/lib/local-tasks";
import { readTask } from "@/lib/task-service";
import { TaskStatus } from "@/types/task";

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

export default function MyTasksPage() {
  const { address, isConnected } = useAccount();

  const storedEntries = useMemo(() => {
    if (!address || !isConnected) return { client: [], worker: [] };
    const userAddress = address as string;
    return {
      client: listTasksFor(userAddress, "client", Number(env.chainId)),
      worker: listTasksFor(userAddress, "worker", Number(env.chainId)),
    };
  }, [address, isConnected]);

  const allEntries = [...storedEntries.client, ...storedEntries.worker];

  const taskQueries = useQueries({
    queries: allEntries.map((entry) => ({
      queryKey: ["task", entry.id],
      queryFn: () => readTask(BigInt(entry.id)),
      enabled: isConnected,
      refetchInterval: 10_000,
    })),
  });

  const taskMap = new Map(
    taskQueries.map((query, index) => {
      const entry = allEntries[index];
      return [entry.id, query.data ?? null] as const;
    })
  );

  if (!isConnected) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-10 w-10" aria-hidden />}
        title="Connect your wallet"
        description="Connect a wallet to browse tasks you’ve created or contributed to."
      />
    );
  }

  const renderTask = (taskId: string) => {
    const task = taskMap.get(taskId);
    if (!task) {
      return (
        <li
          key={taskId}
          className="rounded-lg border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground"
        >
          Task #{taskId} (not found on-chain)
        </li>
      );
    }

    return (
      <li
        key={taskId}
        className="rounded-lg border border-border bg-card/60 p-4 shadow-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/task/${taskId}`}
              className="text-base font-semibold text-primary hover:underline"
            >
              Task #{taskId}
            </Link>
            <p className="text-xs text-muted-foreground">
              Worker: {shorten(task.worker)} · Attestor:{" "}
              {shorten(task.attestor)}
            </p>
          </div>
          <Badge variant={statusMeta[task.status]?.variant ?? "secondary"}>
            {statusMeta[task.status]?.label ?? "Unknown"}
          </Badge>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="My tasks"
        description="Tasks you’ve created or contributed to are cached locally for quick access."
        actions={
          <Button asChild>
            <Link href="/task/new">Create new task</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <CardTitle>As client</CardTitle>
              <CardDescription>Escrows you created and funded.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {storedEntries.client.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-8 w-8" aria-hidden />}
                title="No escrows yet"
                description="Create your first task escrow in seconds."
                action={
                  <Button asChild size="sm">
                    <Link href="/task/new">Create a task</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {storedEntries.client.map((entry) => renderTask(entry.id))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <CardTitle>As worker</CardTitle>
              <CardDescription>Tasks where you submitted work.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {storedEntries.worker.length === 0 ? (
              <EmptyState
                icon={<UserCheck className="h-8 w-8" aria-hidden />}
                title="No submissions yet"
                description="Find a task, submit work, and we’ll keep the record here."
              />
            ) : (
              <ul className="space-y-3">
                {storedEntries.worker.map((entry) => renderTask(entry.id))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function shorten(value: string) {
  if (!value) return "";
  return value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}
