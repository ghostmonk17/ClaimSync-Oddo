import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { Users, Receipt, Clock, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Expenses" value="$48,230" subtitle="This month" icon={<DollarSign className="h-5 w-5" />} variant="primary" trend="+12% vs last month" />
          <StatCard title="Total Users" value={24} subtitle="Across all roles" icon={<Users className="h-5 w-5" />} />
          <StatCard title="Pending Approvals" value={8} icon={<Clock className="h-5 w-5" />} variant="warning" />
          <StatCard title="Total Submitted" value={156} subtitle="This month" icon={<Receipt className="h-5 w-5" />} variant="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border rounded-lg p-5 shadow-sm">
            <h2 className="font-medium mb-4">Category Breakdown</h2>
            <div className="space-y-3">
              {[
                { name: "Travel", amount: "$18,400", pct: 38 },
                { name: "Meals", amount: "$12,200", pct: 25 },
                { name: "Software", amount: "$8,100", pct: 17 },
                { name: "Equipment", amount: "$5,800", pct: 12 },
                { name: "Other", amount: "$3,730", pct: 8 },
              ].map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c.amount} ({c.pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-5 shadow-sm">
            <h2 className="font-medium mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[
                { action: "Expense approved", user: "Sarah Manager", time: "2 min ago" },
                { action: "New user created", user: "Admin", time: "15 min ago" },
                { action: "Policy updated", user: "Admin", time: "1 hour ago" },
                { action: "Report submitted", user: "John Employee", time: "2 hours ago" },
                { action: "Expense flagged", user: "Mike Finance", time: "3 hours ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p>{a.action} <span className="text-muted-foreground">by {a.user}</span></p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
