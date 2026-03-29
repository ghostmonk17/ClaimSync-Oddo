import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Receipt, FileText, Clock, Plus, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function EmployeeDashboard() {
  const { data: expensesRes, isLoading, error } = useQuery({
    queryKey: ["expenses", "my"],
    queryFn: async () => {
      const res = await api.get("/expenses");
      return res.data;
    }
  });

  const expenses = expensesRes?.data || [];
  const recentExpenses = expenses.slice(0, 5); // Just taking the 5 most recent
  
  // Quick Stat Calculations
  const submittedCount = expenses.length;
  const submittedTotal = expenses.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
  
  const pendingCount = expenses.filter((e: any) => e.status === 'SUBMITTED' || e.approval_status === 'PENDING').length;
  const pendingTotal = expenses.filter((e: any) => e.status === 'SUBMITTED' || e.approval_status === 'PENDING').reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
  
  const approvedCount = expenses.filter((e: any) => e.approval_status === 'APPROVED').length;
  const approvedTotal = expenses.filter((e: any) => e.approval_status === 'APPROVED').reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

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
          <StatCard title="Total Lifetime Executions" value={`$${submittedTotal.toFixed(2)}`} subtitle={`${submittedCount} expenses`} icon={<Receipt className="h-5 w-5" />} variant="primary" />
          <StatCard title="Pending Approvals" value={pendingCount.toString()} subtitle={`$${pendingTotal.toFixed(2)} total`} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Approved Total" value={`$${approvedTotal.toFixed(2)}`} subtitle={`${approvedCount} expenses`} icon={<FileText className="h-5 w-5" />} variant="success" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-medium">Recent Expenses</h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
               <div className="flex justify-center p-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
               </div>
            ) : error ? (
               <div className="flex justify-center items-center p-8 text-destructive">
                  <AlertCircle className="h-6 w-6 mr-2" /> Failed to load dashboard data.
               </div>
            ) : recentExpenses.length === 0 ? (
               <div className="flex flex-col justify-center items-center p-8 text-muted-foreground text-center">
                  <p>No expenses generated yet.</p>
               </div>
            ) : (
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
                {recentExpenses.map((e: any) => (
                  <tr key={e._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium">{e.description || 'N/A'}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground capitalize">{e.category}</td>
                    <td className="p-3">{e.currency} {(e.amount || 0).toFixed(2)}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="p-3"><StatusBadge status={e.status?.toLowerCase() || 'draft'} /></td>
                  </tr>
                ))}
              </tbody>
             </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
