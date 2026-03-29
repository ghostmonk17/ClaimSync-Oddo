import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", country: "", base_currency: "USD" });

  const { data: companyRes, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const res = await api.get("/company");
      return res.data;
    }
  });

  useEffect(() => {
    if (companyRes?.data) {
      setFormData({
        name: companyRes.data.name || "",
        country: companyRes.data.country || "",
        base_currency: companyRes.data.base_currency || "USD"
      });
    }
  }, [companyRes]);

  const updateMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.put("/company", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast({ title: "Settings Saved", description: "Company information updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] }); // Invalidates user context if company name propagates there
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.response?.data?.message || err.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout allowedRoles={["admin"]}>
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
           <Settings className="w-6 h-6 text-primary"/> System Settings
        </h1>

        <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 shadow-sm space-y-5 relative">
          <h2 className="font-medium text-lg">Company Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
             Modifying these settings updates the base currency, locale logic, and global app branding across all employee dashboards natively.
          </p>

          <div className="grid gap-4 mt-6">
            <div className="space-y-2">
               <Label htmlFor="c-name">Registered Company Name</Label>
               <Input 
                 id="c-name" 
                 value={formData.name} 
                 onChange={(e) => setFormData({...formData, name: e.target.value})} 
                 placeholder="e.g. Acme Corp" 
                 required 
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="c-country">Operating Country</Label>
                  <Input 
                    id="c-country" 
                    value={formData.country} 
                    onChange={(e) => setFormData({...formData, country: e.target.value})} 
                    placeholder="e.g. United States" 
                  />
               </div>
               
               <div className="space-y-2">
                  <Label htmlFor="c-currency">Default Base Currency</Label>
                  <Input 
                    id="c-currency" 
                    value={formData.base_currency} 
                    onChange={(e) => setFormData({...formData, base_currency: e.target.value.toUpperCase()})} 
                    placeholder="e.g. USD, EUR, GBP" 
                    maxLength={3}
                  />
               </div>
            </div>
          </div>

          <div className="pt-4 border-t mt-6">
            <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto min-w-[140px]">
               {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} 
               {updateMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>

        <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6 mt-8 opacity-75">
          <h2 className="font-medium text-lg">System Notifications (Read-Only)</h2>
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-medium">Email alerts for Workflow</p>
                   <p className="text-xs text-muted-foreground">Automatically ping Managers when SLA is approaching</p>
                </div>
                <Switch disabled checked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-medium">Policy violation webhooks</p>
                   <p className="text-xs text-muted-foreground">Alert Security & Finance via slack/teams Integration</p>
                </div>
                <Switch disabled checked />
              </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
