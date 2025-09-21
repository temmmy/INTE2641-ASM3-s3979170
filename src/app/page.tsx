import Link from "next/link";
import { CheckCircle2, Shield, Timer, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

const checklist = [
  "Escrow funds with ETH or ERC-20 up front",
  "Worker submits proof within the agreed deadline",
  "Attestor issues the TaskCompleted EAS attestation",
  "Contract validates schema, attestor, worker, and taskId before paying",
];

const safeguards = [
  "Base Sepolia-only network enforced in the UI",
  "Payout/refund paths protected by ReentrancyGuard and SafeERC20",
  "Automatic client refunds after deadlines without attestations",
  "Local task history for quick access to active escrows",
];

export default function Home() {
  return (
    <div className="space-y-12">
      <PageHeader
        title="Attestation-gated escrow for micro-tasks"
        description="Fund work safely, let trusted attestors confirm completion via EAS, and release payments only when the on-chain attestation passes verification."
        actions={
          <>
            <Link
              href="/task/new"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Create a task
            </Link>
            <Link
              href="/me"
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
            >
              View my tasks
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center gap-3">
            <Wallet className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <CardTitle className="text-base font-semibold">How it works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {checklist.map((item, index) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-xs font-semibold text-primary/80">{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center gap-3">
            <Shield className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <CardTitle className="text-base font-semibold">Built-in safeguards</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {safeguards.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: <Timer className="h-5 w-5 text-primary" aria-hidden />,
            title: "Deadline-aware",
            description: "Escrow auto-refunds to the client when no attestation arrives by the deadline.",
          },
          {
            icon: <Shield className="h-5 w-5 text-primary" aria-hidden />,
            title: "Schema locked",
            description: "Contract verifies the TaskCompleted schema UID, attestor, worker, and taskId binding.",
          },
          {
            icon: <Wallet className="h-5 w-5 text-primary" aria-hidden />,
            title: "Wallet-first",
            description: "RainbowKit + wagmi provide wallet UX, network enforcement, and transaction insights.",
          },
          {
            icon: <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />,
            title: "EAS-native",
            description: "Attestation preview validates schema, recipients, and expiry before releasing funds.",
          },
        ].map((feature) => (
          <Card key={feature.title} className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center gap-3">
              {feature.icon}
              <CardTitle className="text-base font-semibold">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {feature.description}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
