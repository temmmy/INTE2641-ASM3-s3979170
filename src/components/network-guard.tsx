"use client";

import { AlertCircle } from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";

export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return null;
  }

  if (!chainId || chainId === Number(env.chainId)) {
    return null;
  }

  const targetChain = chains.find((chain) => chain.id === Number(env.chainId));

  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-medium">Wrong network</p>
        <p className="text-xs text-destructive/80">
          Switch to {targetChain?.name ?? `chain ${env.chainId}`} to continue.
        </p>
      </div>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => switchChain({ chainId: Number(env.chainId) })}
        disabled={isPending}
      >
        {isPending ? "Switching" : "Switch"}
      </Button>
    </div>
  );
}
