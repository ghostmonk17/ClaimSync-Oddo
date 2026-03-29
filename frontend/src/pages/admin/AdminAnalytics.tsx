import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { BarChart3, TrendingUp, Receipt, DollarSign } from "lucide-react";

export default function AdminAnalytics() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Expenses (YTD)" value="$142,800" icon={<DollarSign className="h-5 w-5" />} variant="primary" trend="+18% vs last year" />
          <StatCard title="Avg per Employee" value="$5,950" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard title="Total Submissions" value={486} icon={<Receipt className="h-5 w-5" />} variant="success" />
          <StatCard title="Rejection Rate" value="8.2%" icon={<BarChart3 className="h-5 w-5" />} variant="warning" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border rounded-lg p-5 shadow-sm">
            <h2 className="font-medium mb-4">Monthly Expense Trend</h2>
            <div className="space-y-2">
              {[
                { month: "Jan", amount: 38200, max: 52000 },
                { month: "Feb", amount: 42100, max: 52000 },
                { month: "Mar", amount: 48230, max: 52000 },
              ].map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-sm w-8 text-muted-foreground">{m.month}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary rounded transition-all" style={{ width: `${(m.amount / m.max) * 100}%` }} />
                  </div>
                  <span className="text-sm w-20 text-right">${(m.amount / 1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-5 shadow-sm">
            <h2 className="font-medium mb-4">Top Spenders</h2>
            <div className="space-y-3">
              {[
                { name: "Alice Brown", amount: "$8,450", dept: "Sales" },
                { name: "John Smith", amount: "$6,200", dept: "Engineering" },
                { name: "Bob Wilson", amount: "$4,800", dept: "Marketing" },
                { name: "Carol Davis", amount: "$3,900", dept: "Product" },
              ].map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{i + 1}</span>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.dept}</p>
                    </div>
                  </div>
                  <span className="font-medium">{s.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
