import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const users = [
  { id: 1, name: "John Smith", email: "john@acme.com", role: "employee", manager: "Sarah Manager" },
  { id: 2, name: "Alice Brown", email: "alice@acme.com", role: "employee", manager: "Sarah Manager" },
  { id: 3, name: "Bob Wilson", email: "bob@acme.com", role: "employee", manager: "Sarah Manager" },
  { id: 4, name: "Sarah Manager", email: "sarah@acme.com", role: "manager", manager: "—" },
  { id: 5, name: "Mike Finance", email: "mike@acme.com", role: "finance", manager: "—" },
  { id: 6, name: "Lisa CFO", email: "lisa@acme.com", role: "cfo", manager: "—" },
];

const roleColors: Record<string, string> = {
  employee: "bg-primary/10 text-primary border-primary/20",
  manager: "bg-warning/10 text-warning border-warning/20",
  finance: "bg-success/10 text-success border-success/20",
  cfo: "bg-destructive/10 text-destructive border-destructive/20",
  admin: "bg-accent text-accent-foreground",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Users</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); toast({ title: "User created" }); setOpen(false); }} className="space-y-4">
                <div><Label>Name</Label><Input className="mt-1.5" required /></div>
                <div><Label>Email</Label><Input type="email" className="mt-1.5" required /></div>
                <div>
                  <Label>Role</Label>
                  <Select>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="cfo">CFO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign Manager</Label>
                  <Select>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select manager" /></SelectTrigger>
                    <SelectContent>
                      {users.filter((u) => u.role === "manager").map((m) => (
                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Create User</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Manager</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">{u.email}</td>
                  <td className="p-3"><Badge variant="outline" className={`capitalize text-xs ${roleColors[u.role]}`}>{u.role}</Badge></td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{u.manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
