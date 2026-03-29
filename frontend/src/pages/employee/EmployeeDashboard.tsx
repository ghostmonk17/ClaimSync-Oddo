import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Receipt, FileText, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const recentExpenses = [
  { id: 1, description: "Client Dinner", category: "Meals", amount: "$85.50", date: "Mar 25", status: "pending" as const },
  { id: 2, description: "Uber to Airport", category: "Travel", amount: "$42.00", date: "Mar 24", status: "approved" as const },
  { id: 3, description: "Office Supplies", category: "Supplies", amount: "$23.99", date: "Mar 22", status: "approved" as const },
  { id: 4, description: "Conference Ticket", category: "Events", amount: "$299.00", date: "Mar 20", status: "rejected" as const },
  { id: 5, description: "Hotel Stay", category: "Travel", amount: "$189.00", date: "Mar 18", status: "pending" as const },
];

export default function EmployeeDashboard() {
  return (
    <DashboardLayout allowedRoles={["employee"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track your expenses and reports</p>
          </div>
          <div className="flex gap-2">
            <Link to="/employee/expenses/new">
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>
            </Link>
            <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> Create Report</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Submitted This Month" value="$639.49" subtitle="5 expenses" icon={<Receipt className="h-5 w-5" />} variant="primary" />
          <StatCard title="Pending Approvals" value="2" subtitle="$274.50 total" icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Approved This Month" value="$365.99" subtitle="3 expenses" icon={<FileText className="h-5 w-5" />} variant="success" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-medium">Recent Expenses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium">{e.description}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{e.category}</td>
                    <td className="p-3">{e.amount}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{e.date}</td>
                    <td className="p-3"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
