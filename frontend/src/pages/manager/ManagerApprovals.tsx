import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckSquare, Clock, CheckCircle, Eye, X, Loader2, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ManagerApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any | null>(null);
  const [comment, setComment] = useState("");

  // Queries
  const { data: approvalsRes, isLoading } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: async () => {
      const res = await api.get("/approvals/pending");
      return res.data;
    }
  });

  const pendingTasks = approvalsRes?.data || [];

  // Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ actionType, id, commentPayload }: { actionType: string, id: string, commentPayload: string }) => {
      let endpoint = `/approvals/${id}/approve`;
      if (actionType === "reject") endpoint = `/approvals/${id}/reject`;
      if (actionType === "send-back") endpoint = `/approvals/${id}/send-back`;

      const res = await api.post(endpoint, { comment: commentPayload });
      return { res: res.data, actionType };
    },
    onSuccess: (data) => {
      if (data.res.already_processed) {
        toast({ title: "Already processed", description: data.res.message, variant: "destructive" });
      } else {
        toast({ title: "Task Completed", description: `You successfully executed: ${data.actionType.toUpperCase()}` });
      }
      queryClient.invalidateQueries({ queryKey: ["approvals", "pending"] });
      setSelected(null);
      setComment("");
    },
    onError: (err: any) => {
      toast({ title: "Action Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
    }
  });

  const handleAction = (actionType: "approve" | "reject" | "send-back", id: string) => {
    actionMutation.mutate({ actionType, id, commentPayload: comment });
  };

  return (
    <DashboardLayout allowedRoles={["manager", "finance", "cfo"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Queue: Pending Approvals</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Pending" value={isLoading ? "-" : pendingTasks.length} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Approved" value={24} subtitle="This month" icon={<CheckCircle className="h-5 w-5" />} variant="success" />
          <StatCard title="Total Reviewed" value={86} icon={<CheckSquare className="h-5 w-5" />} variant="primary" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          {isLoading ? (
             <div className="flex justify-center items-center p-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : pendingTasks.length === 0 ? (
             <div className="flex flex-col justify-center items-center p-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-success opacity-50 mb-3" />
                <p>No pending approvals in your queue!</p>
             </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Expense Target</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Risk Score</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Submitted</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map((t: any) => {
                  const expense = t.expense_id || {};
                  return (
                  <tr key={t._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium capitalize">{expense.category || "Unknown"}</td>
                    <td className="p-3">
                       <span className={`px-2 py-0.5 rounded text-xs font-bold ${expense.risk_score > 0.5 ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                         {(expense.risk_score * 10).toFixed(1)} / 10
                       </span>
                    </td>
                    <td className="p-3 font-semibold">{expense.currency} {(expense.amount || 0).toFixed(2)}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="p-3"><StatusBadge status={t.status.toLowerCase()} /></td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(t)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => !actionMutation.isPending && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Expense Decision Engine</DialogTitle></DialogHeader>
          {selected && selected.expense_id && (
            <div className="space-y-4">
              
              <div className="bg-muted/30 p-4 rounded-lg flex justify-between items-center border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Requested Amount</p>
                    <p className="text-2xl font-bold">{selected.expense_id.currency} {(selected.expense_id.amount || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Engine Risk Score</p>
                    <p className={`text-xl font-bold ${selected.expense_id.risk_score > 0.5 ? 'text-destructive' : 'text-success'}`}>
                       {(selected.expense_id.risk_score * 10).toFixed(1)} / 10.0
                    </p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm px-1">
                <div><span className="text-muted-foreground">Category:</span> <strong>{selected.expense_id.category}</strong></div>
                <div><span className="text-muted-foreground">Workflow SLA:</span> {new Date(selected.due_date).toLocaleDateString()}</div>
                <div className="col-span-2">
                   <span className="text-muted-foreground">Policy Violations:</span> {selected.expense_id.violations?.length || 0}
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground border border-dashed">
                  Access Receipt File via API logic here
              </div>

              {selected.status === "PENDING" && (
                <div className="space-y-3 pt-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Audit Comment (Required for Rejections)</Label>
                    <Textarea placeholder="Explain your decision..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="mt-1" disabled={actionMutation.isPending} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction("approve", selected._id)} className="flex-1 bg-success hover:bg-success/90" disabled={actionMutation.isPending}>
                      {actionMutation.isPending && actionMutation.variables?.actionType === 'approve' ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />} 
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => handleAction("send-back", selected._id)} className="flex-1 border-warning text-warning hover:bg-warning/10" disabled={actionMutation.isPending}>
                      {actionMutation.isPending && actionMutation.variables?.actionType === 'send-back' ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCcw className="h-4 w-4 mr-2" />} 
                      Send Back
                    </Button>
                    <Button variant="destructive" onClick={() => handleAction("reject", selected._id)} className="flex-1" disabled={actionMutation.isPending || !comment.trim()}>
                      {actionMutation.isPending && actionMutation.variables?.actionType === 'reject' ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4 mr-2" />} 
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
