import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, Shield, Eye, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const expenses = [
  { id: 1, employee: "John Smith", category: "Meals", amount: "$85.50", converted: "$85.50", managerStatus: "approved" as const, flags: [], status: "pending" as const },
  { id: 2, employee: "Alice Brown", category: "Travel", amount: "€380.00", converted: "$418.00", managerStatus: "approved" as const, flags: ["Over budget"], status: "pending" as const },
  { id: 3, employee: "Bob Wilson", category: "Meals", amount: "$120.00", converted: "$120.00", managerStatus: "approved" as const, flags: ["Missing receipt", "Over limit"], status: "flagged" as const },
  { id: 4, employee: "Carol Davis", category: "Software", amount: "$499.00", converted: "$499.00", managerStatus: "approved" as const, flags: [], status: "pending" as const },
  { id: 5, employee: "John Smith", category: "Travel", amount: "$35.00", converted: "$35.00", managerStatus: "approved" as const, flags: [], status: "approved" as const },
];

export default function FinanceDashboard() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<typeof expenses[0] | null>(null);
  const [comment, setComment] = useState("");

  const handleAction = (action: string, id: number) => {
    toast({ title: action.charAt(0).toUpperCase() + action.slice(1), description: `Expense #${id} ${action}d.` });
    setSelected(null);
  };

  return (
    <DashboardLayout allowedRoles={["finance"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Finance Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Pending Review" value={3} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Flagged" value={1} icon={<AlertTriangle className="h-5 w-5" />} variant="destructive" />
          <StatCard title="Verified" value={8} icon={<CheckCircle className="h-5 w-5" />} variant="success" />
          <StatCard title="Total Processed" value="$4,230" icon={<Shield className="h-5 w-5" />} variant="primary" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <div className="p-4 border-b"><h2 className="font-medium">Finance Approval Queue</h2></div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Converted</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Manager</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Flags</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${e.flags.length > 0 ? "bg-destructive/5" : ""}`}>
                  <td className="p-3 font-medium">{e.employee}</td>
                  <td className="p-3 text-muted-foreground">{e.category}</td>
                  <td className="p-3">{e.amount}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">{e.converted}</td>
                  <td className="p-3 hidden md:table-cell"><StatusBadge status={e.managerStatus} /></td>
                  <td className="p-3">
                    {e.flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {e.flags.map((f) => (
                          <Badge key={f} variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">{f}</Badge>
                        ))}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(e)}><Eye className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Finance Review</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Employee:</span> <strong>{selected.employee}</strong></div>
                <div><span className="text-muted-foreground">Amount:</span> <strong>{selected.amount}</strong></div>
                <div><span className="text-muted-foreground">Converted:</span> {selected.converted}</div>
                <div><span className="text-muted-foreground">Category:</span> {selected.category}</div>
              </div>
              {selected.flags.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Policy Violations</p>
                  <ul className="text-sm text-destructive mt-1 list-disc list-inside">{selected.flags.map((f) => <li key={f}>{f}</li>)}</ul>
                </div>
              )}
              <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">Receipt & OCR preview area</div>
              {selected.status !== "approved" && (
                <>
                  <Textarea placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction("approve", selected.id)} className="flex-1"><CheckCircle className="h-4 w-4 mr-1" /> Verify & Approve</Button>
                    <Button variant="destructive" onClick={() => handleAction("reject", selected.id)} className="flex-1"><X className="h-4 w-4 mr-1" /> Reject</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
