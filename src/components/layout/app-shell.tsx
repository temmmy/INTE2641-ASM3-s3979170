"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { NetworkGuard } from "@/components/network-guard";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link className="font-semibold tracking-tight" href="/">
            AGE Escrow
          </Link>
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
        </div>
        <div className="mx-auto w-full max-w-6xl px-6 pb-3">
          <NetworkGuard />
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
      </main>
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        Built for the AGE attestation-gated escrow demo.
      </footer>
    </div>
  );
}
