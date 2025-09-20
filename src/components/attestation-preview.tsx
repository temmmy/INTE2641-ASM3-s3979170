import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type AttestationCheck = {
  label: string;
  pass: boolean;
  hint?: string;
};

type AttestationPreviewProps = {
  checks: AttestationCheck[];
  isLoading?: boolean;
  uid: string;
};

export function AttestationPreview({ checks, uid, isLoading }: AttestationPreviewProps) {
  if (!uid) return null;

  if (checks.length === 0) {
    return (
      <Card className="border-dashed bg-background/60">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Enter an attestation UID to preview validation checks.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed bg-background/60">
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Attestation preview</span>
          {isLoading ? <Badge variant="outline">Checking…</Badge> : null}
        </div>
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2">
              <Badge
                variant={check.pass ? "default" : "destructive"}
                className={check.pass ? "bg-emerald-500/15 text-emerald-700" : undefined}
              >
                {check.pass ? "OK" : "Fail"}
              </Badge>
              <div>
                <p className="font-medium text-foreground">{check.label}</p>
                {check.hint ? <p className="text-xs text-muted-foreground">{check.hint}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
