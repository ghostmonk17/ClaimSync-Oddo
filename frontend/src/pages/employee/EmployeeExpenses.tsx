import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function EmployeeExpenses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: expensesRes, isLoading, error } = useQuery({
    queryKey: ["expenses", "my"],
    queryFn: async () => {
      const res = await api.get("/expenses");
      return res.data;
    }
  });

  const expenses = expensesRes?.data || [];
  const filtered = expenses.filter((e: any) => 
    (e.description || e.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout allowedRoles={["employee"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <Link to="/employee/expenses/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>
          </Link>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          {isLoading ? (
             <div className="flex justify-center p-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : error ? (
             <div className="flex justify-center items-center p-12 text-destructive">
                <AlertCircle className="h-6 w-6 mr-2" /> Failed to load expenses.
             </div>
          ) : expenses.length === 0 ? (
             <div className="flex flex-col justify-center items-center p-12 text-muted-foreground text-center">
                <p>No expenses recorded yet.</p>
                <Link to="/employee/expenses/new" className="text-primary hover:underline mt-2 text-sm">Create your first expense →</Link>
             </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => (
                  <tr 
                    key={e._id} 
                    className={`border-b last:border-0 transition-colors ${e.status === 'DRAFT' ? 'hover:bg-primary/5 cursor-pointer' : 'hover:bg-muted/10'}`}
                    onClick={() => e.status === 'DRAFT' && navigate(`/employee/expenses/${e._id}/edit`)}
                  >
                    <td className="p-3 font-medium">{e.description || 'N/A'}</td>
                    <td className="p-3 text-muted-foreground capitalize">{e.category}</td>
                    <td className="p-3">{e.currency} {(e.amount || 0).toFixed(2)}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        <StatusBadge status={e.status?.toLowerCase() || 'draft'} />
                        {e.pending_roles && e.pending_roles.length > 0 && (
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/40 px-1.5 py-0.5 rounded">
                            Step {e.current_step}: {e.pending_roles.join(', ')}
                          </span>
                        )}
                        {e.parallel_progress && (
                           <div className="w-full min-w-[100px] bg-muted rounded-full h-1.5 mt-0.5 overflow-hidden" title={`${e.parallel_progress.approved_count}/${e.parallel_progress.total_count} approved (${e.parallel_progress.ruleType})`}>
                              <div 
                                className="bg-primary h-1.5 rounded-full transition-all" 
                                style={{ width: `${Math.max(0, Math.min(100, e.parallel_progress.percentage_complete * 100))}%` }} 
                              />
                           </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
