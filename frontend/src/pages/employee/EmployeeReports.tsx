import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

const reports = [
  { id: 1, title: "March Travel Report", total: "$516.00", expenses: 3, status: "pending" as const, violations: 0 },
  { id: 2, title: "Q1 Client Expenses", total: "$1,245.50", expenses: 8, status: "approved" as const, violations: 1 },
  { id: 3, title: "February Supplies", total: "$89.97", expenses: 2, status: "approved" as const, violations: 0 },
];

export default function EmployeeReports() {
  return (
    <DashboardLayout allowedRoles={["employee"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Reports</h1>
          <Button size="sm"><FileText className="h-4 w-4 mr-1" /> Create Report</Button>
        </div>

        <div className="grid gap-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-card border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.expenses} expenses · Total: {r.total}</p>
                  {r.violations > 0 && <p className="text-xs text-destructive mt-1">⚠ {r.violations} policy violation(s)</p>}
                </div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
