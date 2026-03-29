import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash, Settings, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const AVAILABLE_ROLES = ["MANAGER", "FINANCE", "SENIOR", "ADMIN", "CFO", "HR", "LEGAL"];

export default function AdminWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<any>({ name: "Custom Workflow", steps: [], override_rules: { cfo_override: true } });

  const { data: configRes, isLoading } = useQuery({
    queryKey: ["workflow-config"],
    queryFn: async () => {
      const res = await api.get("/workflow-config");
      return res.data;
    }
  });

  useEffect(() => {
    if (configRes?.data) {
       setConfig(configRes.data);
    }
  }, [configRes]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/workflow-config", payload);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Workflow Saved", description: "Your custom approval sequence is now active globally." });
      queryClient.invalidateQueries({ queryKey: ["workflow-config"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save workflow", description: err.response?.data?.message || err.message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    // Sanitize steps structurally before pushing
    const cleanSteps = config.steps.map((s: any, idx: number) => ({
       step: idx + 1,
       type: s.type,
       roles: s.roles,
       required_approvals: s.type === "PARALLEL" ? (s.required_approvals || 1) : 1,
       rule: s.type === "PARALLEL" ? s.rule : { type: "ALL", percentage: null }
    }));
    saveMutation.mutate({ ...config, steps: cleanSteps });
  };

  const addStep = () => {
    setConfig({
      ...config,
      steps: [...config.steps, { type: "SEQUENTIAL", roles: ["MANAGER"], required_approvals: 1, rule: { type: "ALL", percentage: null } }]
    });
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setConfig({ ...config, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = [...config.steps];
    newSteps.splice(index, 1);
    setConfig({ ...config, steps: newSteps });
  };

  if (isLoading) return <DashboardLayout allowedRoles={["admin"]}><div className="flex h-[400px] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
           <div>
             <h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-primary"/> Workflow Builder</h1>
             <p className="text-muted-foreground mt-1">Design your enterprise approval pipeline. Supports Parallel and Sequential execution engines.</p>
           </div>
           <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full sm:w-auto min-w-[120px]">
             {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Save Active Workflow
           </Button>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6">
           <div className="space-y-4">
             <div>
               <Label className="text-sm font-semibold">Workflow Name</Label>
               <Input value={config.name || ""} onChange={(e) => setConfig({...config, name: e.target.value})} className="mt-1 max-w-sm" />
             </div>
             <div className="flex items-center space-x-2 pt-2">
                 <Switch 
                   checked={config.override_rules?.cfo_override || false}
                   onCheckedChange={(c) => setConfig({...config, override_rules: { cfo_override: c }})}
                 />
                 <Label>Enable CFO Override Force-Approval</Label>
             </div>
           </div>

           <div className="mt-8 border-t pt-8">
             <h3 className="text-lg font-semibold mb-4 text-foreground/80 flex items-center justify-between">
                Execution Steps
                <Button size="sm" variant="outline" onClick={addStep}><Plus className="h-4 w-4 mr-1"/> Add Step</Button>
             </h3>

             {config.steps.length === 0 ? (
                <div className="text-center p-8 bg-muted/20 border border-dashed rounded-lg text-muted-foreground text-sm">
                  Click 'Add Step' to begin building the approval sequencer organically.
                </div>
             ) : (
                <div className="space-y-4">
                  {config.steps.map((step: any, idx: number) => (
                     <div key={idx} className="flex gap-4 p-4 border rounded-lg bg-card shadow-sm hover:border-primary/30 transition-colors">
                       <div className="flex flex-col items-center justify-center bg-primary/10 rounded-full h-10 w-10 text-primary font-bold mr-2 mt-1 shrink-0">
                         {idx + 1}
                       </div>
                       
                       <div className="flex-1 space-y-4 pt-1">
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Execution Type</Label>
                                <Select value={step.type} onValueChange={(val) => updateStep(idx, "type", val)}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="SEQUENTIAL">Sequential (1-to-1)</SelectItem>
                                    <SelectItem value="PARALLEL">Parallel (Shared Pool)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Assign to Role(s)</Label>
                                <Select 
                                   value={step.roles[0] || ""} 
                                   onValueChange={(val) => updateStep(idx, "roles", [val])} // Keeping simple single array mapper
                                >
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                    {AVAILABLE_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                          </div>

                          {step.type === "PARALLEL" && (
                            <div className="bg-muted/30 p-3 rounded-md border mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <div>
                                  <Label className="text-xs text-muted-foreground">Parallel Rule Type</Label>
                                  <Select value={step.rule?.type || "ALL"} onValueChange={(val) => updateStep(idx, "rule", { ...step.rule, type: val })}>
                                     <SelectTrigger className="h-8 mt-1"><SelectValue/></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="ALL">All Role Members Must Approve</SelectItem>
                                        <SelectItem value="ANY">Any Standard Approver Can Process</SelectItem>
                                        <SelectItem value="PERCENTAGE">Require Percentage (Threshold)</SelectItem>
                                     </SelectContent>
                                  </Select>
                               </div>

                               {step.rule?.type === "PERCENTAGE" && (
                                 <div>
                                    <Label className="text-xs text-muted-foreground block">Percentage (0.1 to 1.0)</Label>
                                    <Input 
                                      type="number" min={0.1} max={1.0} step={0.1} className="h-8 mt-1" 
                                      value={step.rule?.percentage || 0.6} 
                                      onChange={(e) => updateStep(idx, "rule", { ...step.rule, percentage: parseFloat(e.target.value) })}
                                    />
                                 </div>
                               )}
                               
                               {step.rule?.type === "ANY" && (
                                 <div>
                                    <Label className="text-xs text-muted-foreground block">Required Approvals</Label>
                                    <Input 
                                      type="number" min={1} max={10} className="h-8 mt-1" 
                                      value={step.required_approvals || 1} 
                                      onChange={(e) => updateStep(idx, "required_approvals", parseInt(e.target.value))}
                                    />
                                 </div>
                               )}
                               
                            </div>
                          )}

                       </div>
                       
                       <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive self-start mt-1" onClick={() => removeStep(idx)}>
                          <Trash className="h-4 w-4"/>
                       </Button>
                     </div>
                  ))}
                </div>
             )}
           </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
