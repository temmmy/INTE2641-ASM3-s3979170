"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { NetworkGuard } from "@/components/network-guard";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/task/new", label: "Create task" },
    { href: "/me", label: "My tasks" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link className="text-lg font-semibold tracking-tight" href="/">
              AGE Escrow
            </Link>
            <div className="sm:hidden">
              <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "rounded-md px-3 py-1.5 transition hover:text-foreground " +
                    (isActive ? "bg-primary/10 text-primary" : "")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden sm:block">
            <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
          </div>
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
