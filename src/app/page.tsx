import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Attestation-gated escrow
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Release payments only when a trusted attestation says the task is complete.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          AGE lets clients fund micro-tasks in advance. Workers share proof of work, attestors verify
          completion through the Ethereum Attestation Service (EAS), and funds unlock instantly once
          the attestation passes on-chain validation.
        </p>
        <div className="flex flex-wrap gap-3">
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
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>1. Fund an escrow with ETH or an ERC-20 token.</li>
            <li>2. Worker submits a work URI before the deadline.</li>
            <li>3. Attestor issues the TaskCompleted EAS attestation.</li>
            <li>4. Contract verifies the attestation and pays the worker.</li>
          </ol>
        </article>
        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Built-in safeguards</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Sepolia-only network access with wallet gating.</li>
            <li>• Reentrancy-safe payouts using SafeERC20 for tokens.</li>
            <li>• Attestation schema, attestor, worker, and task binding enforced.</li>
            <li>• Automatic refunds when deadlines expire without attestation.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
