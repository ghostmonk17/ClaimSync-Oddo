import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, Trash, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminPolicy() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newRule, setNewRule] = useState({
     category: "Meals",
     maxAmount: 100,
     receiptRequired: true,
     violationType: "Soft"
  });

  const { data: rulesRes, isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const res = await api.get("/policies");
      return res.data.data;
    }
  });

  const createRuleMutation = useMutation({
    mutationFn: async (payload: typeof newRule) => {
       return api.post("/policies", payload);
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["policies"] });
       toast({ title: "Rule Created", description: "Successfully bound to the risk engine." });
       setOpen(false);
    },
    onError: (err: any) => {
       toast({ title: "Failed to create rule", description: err.response?.data?.message || err.message, variant: "destructive" });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
       return api.delete(`/policies/${id}`);
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["policies"] });
       toast({ title: "Rule Deleted", description: "Removed from the risk engine." });
    }
  });

  const rules = rulesRes || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createRuleMutation.mutate(newRule);
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Policy & Rules</h1>
            <p className="text-sm text-muted-foreground">Configure dynamic expense categories and thresholds.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
               <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
            </DialogTrigger>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Configure New Protocol</DialogTitle>
                  <DialogDescription>Dictate what triggers hard or soft flags natively.</DialogDescription>
               </DialogHeader>
               <form onSubmit={handleCreate} className="space-y-4 mt-2">
                  <div className="space-y-2">
                     <Label>Expense Category</Label>
                     <Input 
                       value={newRule.category} 
                       onChange={(e) => setNewRule({...newRule, category: e.target.value})} 
                       placeholder="e.g. Software, Travel, Education" 
                       required 
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Maximum Allowed Amount ({user?.currency || "USD"})</Label>
                     <Input 
                       type="number" min={0} 
                       value={newRule.maxAmount} 
                       onChange={(e) => setNewRule({...newRule, maxAmount: Number(e.target.value)})} 
                       required 
                     />
                  </div>
                  <div className="flex flex-col gap-4 pt-2">
                     <div className="flex items-center justify-between">
                       <div>
                         <Label className="font-semibold block">Require Receipt Proof</Label>
                         <span className="text-xs text-muted-foreground">Hard-block flow if missing</span>
                       </div>
                       <Switch 
                         checked={newRule.receiptRequired} 
                         onCheckedChange={(c) => setNewRule({...newRule, receiptRequired: c})}
                       />
                     </div>
                     <div className="space-y-2">
                        <Label>Violation Handling Type</Label>
                        <Select 
                          value={newRule.violationType} 
                          onValueChange={(v) => setNewRule({...newRule, violationType: v})}
                        >
                           <SelectTrigger><SelectValue/></SelectTrigger>
                           <SelectContent>
                              <SelectItem value="Soft">Soft Flag (Requires Justification)</SelectItem>
                              <SelectItem value="Hard">Hard Block (Strict Enforcement)</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <Button type="submit" disabled={createRuleMutation.isPending} className="w-full mt-4">
                     {createRuleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                     {createRuleMutation.isPending ? "Configuring..." : "Add to Risk Engine"}
                  </Button>
               </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Max Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Receipt Required</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Violation Type</th>
                  <th className="text-right p-4 font-medium text-muted-foreground w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No custom rules configured yet.</td></tr>
                ) : (
                  rules.map((r: any) => (
                    <tr key={r._id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" />{r.category}</td>
                      <td className="p-4">{user?.currency || "USD"} {r.maxAmount.toFixed(2)}</td>
                      <td className="p-4"><Switch checked={r.receiptRequired} disabled /></td>
                      <td className="p-4">
                        <Badge variant="outline" className={r.violationType === "Hard" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}>
                          {r.violationType}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteRuleMutation.mutate(r._id)}>
                            <Trash className="h-4 w-4" />
                         </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
