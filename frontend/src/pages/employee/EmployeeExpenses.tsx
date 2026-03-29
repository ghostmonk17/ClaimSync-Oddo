import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

const expenses = [
  { id: 1, description: "Client Dinner", category: "Meals", amount: "$85.50", date: "2024-03-25", status: "pending" as const },
  { id: 2, description: "Uber to Airport", category: "Travel", amount: "$42.00", date: "2024-03-24", status: "approved" as const },
  { id: 3, description: "Office Supplies", category: "Supplies", amount: "$23.99", date: "2024-03-22", status: "approved" as const },
  { id: 4, description: "Conference Ticket", category: "Events", amount: "$299.00", date: "2024-03-20", status: "rejected" as const },
  { id: 5, description: "Hotel Stay", category: "Travel", amount: "$189.00", date: "2024-03-18", status: "pending" as const },
  { id: 6, description: "Software License", category: "Software", amount: "$49.99", date: "2024-03-15", status: "approved" as const },
];

export default function EmployeeExpenses() {
  const [search, setSearch] = useState("");
  const filtered = expenses.filter((e) => e.description.toLowerCase().includes(search.toLowerCase()));

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
              {filtered.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="p-3 font-medium">{e.description}</td>
                  <td className="p-3 text-muted-foreground">{e.category}</td>
                  <td className="p-3">{e.amount}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{e.date}</td>
                  <td className="p-3"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
