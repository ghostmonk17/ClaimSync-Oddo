import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, Crown, Eye, X, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const expenses = [
  { id: 1, employee: "Alice Brown", category: "Travel", amount: "$2,450.00", financeStatus: "approved" as const, status: "pending" as const, highValue: true, chain: ["Manager ✓", "Finance ✓", "CFO ⏳"] },
  { id: 2, employee: "Bob Wilson", category: "Equipment", amount: "$5,200.00", financeStatus: "approved" as const, status: "pending" as const, highValue: true, chain: ["Manager ✓", "Finance ✓", "CFO ⏳"] },
  { id: 3, employee: "Carol Davis", category: "Events", amount: "$1,800.00", financeStatus: "flagged" as const, status: "pending" as const, highValue: false, chain: ["Manager ✓", "Finance ⚠", "CFO ⏳"] },
  { id: 4, employee: "John Smith", category: "Travel", amount: "$890.00", financeStatus: "approved" as const, status: "approved" as const, highValue: false, chain: ["Manager ✓", "Finance ✓", "CFO ✓"] },
];

export default function CfoDashboard() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<typeof expenses[0] | null>(null);
  const [comment, setComment] = useState("");

  const handleAction = (action: string, id: number) => {
    toast({ title: action === "override" ? "Overridden" : action.charAt(0).toUpperCase() + action.slice(1), description: `Expense #${id} ${action}d.` });
    setSelected(null);
  };

  return (
    <DashboardLayout allowedRoles={["cfo"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">CFO Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Pending Final Approval" value={3} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="High-Value" value={2} subtitle=">$2,000" icon={<AlertTriangle className="h-5 w-5" />} variant="destructive" />
          <StatCard title="Overridden" value={1} subtitle="This month" icon={<ShieldAlert className="h-5 w-5" />} variant="primary" />
          <StatCard title="Total Approved" value="$24,500" icon={<Crown className="h-5 w-5" />} variant="success" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <div className="p-4 border-b"><h2 className="font-medium">CFO Approval Queue</h2></div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Finance</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Workflow</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${e.highValue ? "bg-warning/5" : ""}`}>
                  <td className="p-3 font-medium flex items-center gap-2">
                    {e.employee}
                    {e.highValue && <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">High</Badge>}
                  </td>
                  <td className="p-3 text-muted-foreground">{e.category}</td>
                  <td className="p-3 font-medium">{e.amount}</td>
                  <td className="p-3 hidden md:table-cell"><StatusBadge status={e.financeStatus} /></td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex gap-1 text-xs">{e.chain.map((c, i) => <span key={i} className="text-muted-foreground">{c}{i < e.chain.length - 1 ? " →" : ""}</span>)}</div>
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
          <DialogHeader><DialogTitle>CFO Review — Final Decision</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Employee:</span> <strong>{selected.employee}</strong></div>
                <div><span className="text-muted-foreground">Amount:</span> <strong>{selected.amount}</strong></div>
                <div><span className="text-muted-foreground">Category:</span> {selected.category}</div>
                <div><span className="text-muted-foreground">Finance:</span> <StatusBadge status={selected.financeStatus} /></div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Approval Chain</p>
                <div className="flex items-center gap-2 text-sm">{selected.chain.map((c, i) => <span key={i}>{c}{i < selected.chain.length - 1 ? " → " : ""}</span>)}</div>
              </div>
              {selected.highValue && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                  <p className="text-sm text-warning flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> High-value expense — requires CFO approval</p>
                </div>
              )}
              <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">Receipt preview area</div>
              {selected.status !== "approved" && (
                <>
                  <Textarea placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction("approve", selected.id)} className="flex-1"><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button>
                    <Button variant="destructive" onClick={() => handleAction("reject", selected.id)} className="flex-1"><X className="h-4 w-4 mr-1" /> Reject</Button>
                    <Button variant="outline" onClick={() => handleAction("override", selected.id)}><ShieldAlert className="h-4 w-4 mr-1" /> Override</Button>
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
