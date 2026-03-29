import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus } from "lucide-react";

const rules = [
  { id: 1, category: "Meals", maxAmount: "$100", receiptRequired: true, violationType: "Soft" },
  { id: 2, category: "Travel", maxAmount: "$2,000", receiptRequired: true, violationType: "Hard" },
  { id: 3, category: "Software", maxAmount: "$500", receiptRequired: false, violationType: "Soft" },
  { id: 4, category: "Equipment", maxAmount: "$5,000", receiptRequired: true, violationType: "Hard" },
  { id: 5, category: "Events", maxAmount: "$1,500", receiptRequired: true, violationType: "Soft" },
];

export default function AdminPolicy() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Policy & Rules</h1>
            <p className="text-sm text-muted-foreground">Configure expense categories and limits</p>
          </div>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Max Amount</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Receipt Required</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Violation Type</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" />{r.category}</td>
                  <td className="p-3">{r.maxAmount}</td>
                  <td className="p-3"><Switch checked={r.receiptRequired} /></td>
                  <td className="p-3">
                    <Badge variant="outline" className={r.violationType === "Hard" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}>
                      {r.violationType}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border rounded-lg p-5 shadow-sm">
          <h2 className="font-medium mb-4">Approval Workflow</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              {["Manager", "Finance", "CFO"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">{step}</div>
                  {i < 2 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
            <Badge variant="outline" className="text-xs">Sequential</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">High-value expenses (&gt;$2,000) require CFO approval</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
