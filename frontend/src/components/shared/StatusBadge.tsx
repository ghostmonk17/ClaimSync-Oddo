import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected" | "flagged" | "submitted" | "draft";

const statusStyles: Record<Status, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  flagged: "bg-destructive/10 text-destructive border-destructive/20",
  submitted: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground border-muted",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium capitalize", statusStyles[status])}>
      {status}
    </Badge>
  );
}
