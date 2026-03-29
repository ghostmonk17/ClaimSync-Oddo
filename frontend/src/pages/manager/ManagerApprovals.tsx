import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, Clock, CheckCircle, Eye, X, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const approvals = [
  { id: 1, employee: "John Smith", description: "Client Dinner", category: "Meals", amount: "$85.50", date: "Mar 25", status: "pending" as const },
  { id: 2, employee: "Alice Brown", description: "Flight to NYC", category: "Travel", amount: "$450.00", date: "Mar 24", status: "pending" as const },
  { id: 3, employee: "Bob Wilson", description: "Team Lunch", category: "Meals", amount: "$120.00", date: "Mar 23", status: "pending" as const },
  { id: 4, employee: "John Smith", description: "Taxi", category: "Travel", amount: "$35.00", date: "Mar 22", status: "approved" as const },
  { id: 5, employee: "Alice Brown", description: "Stationery", category: "Supplies", amount: "$15.99", date: "Mar 21", status: "approved" as const },
];

export default function ManagerApprovals() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<typeof approvals[0] | null>(null);
  const [comment, setComment] = useState("");

  const handleAction = (action: "approve" | "reject", id: number) => {
    toast({ title: action === "approve" ? "Approved" : "Rejected", description: `Expense #${id} has been ${action}d.` });
    setSelected(null);
    setComment("");
  };

  return (
    <DashboardLayout allowedRoles={["manager"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Manager Approvals</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Pending" value={3} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Approved" value={12} subtitle="This month" icon={<CheckCircle className="h-5 w-5" />} variant="success" />
          <StatCard title="Total Reviewed" value={15} icon={<CheckSquare className="h-5 w-5" />} variant="primary" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Expense</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium">{a.employee}</td>
                  <td className="p-3 text-muted-foreground">{a.description}</td>
                  <td className="p-3">{a.amount}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{a.date}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(a)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Expense Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Employee:</span> <strong>{selected.employee}</strong></div>
                <div><span className="text-muted-foreground">Amount:</span> <strong>{selected.amount}</strong></div>
                <div><span className="text-muted-foreground">Category:</span> {selected.category}</div>
                <div><span className="text-muted-foreground">Date:</span> {selected.date}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">Receipt preview area</div>
              {selected.status === "pending" && (
                <>
                  <div>
                    <Textarea placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction("approve", selected.id)} className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleAction("reject", selected.id)} className="flex-1">
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
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
