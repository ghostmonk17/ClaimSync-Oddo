import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckSquare, Clock, CheckCircle, Eye, X, Loader2, RefreshCcw, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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

  // Local analytics from raw data
  const approvedTotal = 12; // Placeholder for backend aggregation later, or pull from different endpoint
  const rejectedTotal = 4;

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
          <StatCard title="Awaiting You" value={isLoading ? "-" : pendingTasks.length} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Company Approved" value={approvedTotal} subtitle="Last 30 Days" icon={<CheckCircle className="h-5 w-5" />} variant="success" />
          <StatCard title="Policy Rejected" value={rejectedTotal} icon={<CheckSquare className="h-5 w-5" />} variant="destructive" />
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
                  <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Employee</th>
                  <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Expense Domain</th>
                  <th className="text-center p-3 font-medium text-muted-foreground whitespace-nowrap">Stage</th>
                  <th className="text-center p-3 font-medium text-muted-foreground whitespace-nowrap">Risk</th>
                  <th className="text-right p-3 font-medium text-muted-foreground whitespace-nowrap">Request</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map((t: any) => {
                  const expense = t.expense_id || {};
                  return (
                  <tr key={t._id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="p-3">
                       <span className="font-bold text-sm block">{expense.user_id?.name || "System"}</span>
                       <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">{expense.user_id?.email || "internal@corp"}</span>
                    </td>
                    <td className="p-3 font-medium text-sm italic">{expense.category || "General"}</td>
                    <td className="p-3 text-center">
                       <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary">S{t.step}: {t.role}</Badge>
                    </td>
                    <td className="p-3 text-center">
                       <span className={`text-[10px] font-black italic rounded px-1.5 py-0.5 ${expense.risk_score > 0.5 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                         {(expense.risk_score * 100).toFixed(0)}%
                       </span>
                    </td>
                    <td className="p-3 text-right font-black text-sm">
                       {expense.currency} {(expense.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" onClick={() => setSelected(t)}>
                        <Eye className="h-4 w-4" />
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
              
              <div className="bg-muted/30 p-4 rounded-lg flex justify-between items-center border shadow-inner">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 italic">Requested Amount</p>
                    <p className="text-2xl font-black text-primary">{selected.expense_id.currency} {(selected.expense_id.amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 italic">Risk Confidence</p>
                    <p className={`text-xl font-black ${selected.expense_id.risk_score > 0.5 ? 'text-destructive' : 'text-success'}`}>
                       {(selected.expense_id.risk_score * 100).toFixed(0)}%
                    </p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm px-1 mt-2">
                <div className="flex flex-col"><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Submitting Employee</span> <strong className="text-base">{selected.expense_id.user_id?.name || "System Record"}</strong></div>
                <div className="flex flex-col"><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Current Approval Stage</span> <strong className="text-base text-primary">Step {selected.step}: {selected.role}</strong></div>
                <div className="flex flex-col"><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Category Branch</span> <strong>{selected.expense_id.category}</strong></div>
                <div className="flex flex-col"><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">SLA Deadline</span> <strong>{new Date(selected.due_date).toLocaleDateString()}</strong></div>
              </div>

              {selected.expense_id.approval_history && selected.expense_id.approval_history.length > 0 && (
                <div className="mt-4 px-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter block mb-2">Audit History</span>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-thin">
                    {selected.expense_id.approval_history.map((h: any, i: number) => (
                      <div key={i} className="flex gap-3 text-xs p-2 bg-muted/20 border-l-2 border-primary/30 rounded-r-md">
                        <div className="font-bold flex-shrink-0 w-16">{h.role}:</div>
                        <div className="flex-1 italic">"{h.comment || 'No comment'}"</div>
                        <div className="text-muted-foreground font-mono">{h.status.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.group_progress && (
                 <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 space-y-2 mt-2">
                    <div className="flex justify-between items-center text-sm">
                       <span className="font-semibold text-primary flex items-center gap-1">
                          Group Progress <span className="text-xs font-normal text-muted-foreground ml-1">({selected.rule?.type || 'ALL'} required)</span>
                       </span>
                       <span className="text-muted-foreground">{selected.group_progress.approved_count} / {selected.group_progress.total_count} Approved</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary transition-all duration-500 ease-in-out" 
                         style={{ width: `${Math.min(100, Math.max(0, selected.group_progress.percentage_complete * 100))}%` }} 
                       />
                    </div>
                 </div>
              )}
              
              {selected.expense_id.receipt_ids && selected.expense_id.receipt_ids.length > 0 ? (
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter block mb-2">Attached Proof of Purchase</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.expense_id.receipt_ids.map((r: any, i: number) => {
                      const fileUrl = r.file_url.startsWith('http') ? r.file_url : `http://localhost:3000${r.file_url}`;
                      const isImage = r.file_type?.startsWith('image/') || r.file_url.match(/\.(jpg|jpeg|png|gif)$/i);
                      
                      return (
                        <div key={i} className="flex flex-col gap-1">
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex flex-col bg-muted/40 rounded-lg border hover:bg-muted/60 transition-all group overflow-hidden"
                          >
                            {isImage ? (
                               <div className="h-24 w-full overflow-hidden bg-black/5 flex items-center justify-center border-b">
                                  <img 
                                    src={fileUrl} 
                                    alt="Receipt Preview" 
                                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    onError={(e: any) => e.target.src = 'https://placehold.co/200x200?text=Receipt'}
                                  />
                               </div>
                            ) : (
                               <div className="h-24 w-full flex items-center justify-center bg-primary/5 border-b">
                                  <Upload className="h-8 w-8 text-primary/40" />
                               </div>
                            )}
                            <div className="p-2 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold truncate">Receipt #{i+1}</p>
                                <p className="text-[9px] text-muted-foreground uppercase">{r.file_type?.split('/')[1] || 'PDF'}</p>
                              </div>
                              <Eye className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                            </div>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-6 text-center text-xs text-muted-foreground border border-dashed mt-4">
                   <X className="h-8 w-8 mx-auto mb-2 opacity-20" />
                   No physical receipts attached to this request.
                </div>
              )}

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
