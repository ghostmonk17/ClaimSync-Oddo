import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const roleColors: Record<string, string> = {
  employee: "bg-primary/10 text-primary border-primary/20",
  manager: "bg-amber-100 text-amber-700 border-amber-200",
  finance: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cfo: "bg-rose-100 text-rose-700 border-rose-200",
  admin: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  const [newUser, setNewUser] = useState({
     name: "",
     email: "",
     role: "",
     manager_id: ""
  });

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.data;
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      return api.post("/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User created successfully", description: "An invite will be sent to their email." });
      setOpen(false);
      setNewUser({ name: "", email: "", role: "", manager_id: "" });
    },
    onError: (err: any) => {
      toast({ 
        title: "Failed to create user", 
        description: err.response?.data?.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const users = usersRes || [];
  const filtered = users.filter((u: any) => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const managers = users.filter((u: any) => u.role === "MANAGER" || u.role === "ADMIN");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.role) {
       toast({ title: "Role required", variant: "destructive" });
       return;
    }
    createUserMutation.mutate(newUser);
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                 <DialogTitle>Create New User</DialogTitle>
                 <DialogDescription>Add a new employee or manager to your organization.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                   <Label htmlFor="new-name">Full Name</Label>
                   <Input id="new-name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. John Doe" required />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="new-email">Email Address</Label>
                   <Input id="new-email" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="john@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label>System Role</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v})}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="CFO">CFO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Direct Manager (Optional)</Label>
                  <Select value={newUser.manager_id} onValueChange={(v) => setNewUser({...newUser, manager_id: v})}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {managers.map((m: any) => (
                        <SelectItem key={m._id} value={m._id}>{m.name || m.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={createUserMutation.isPending}>
                   {createUserMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                   Create Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
             <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">User Details</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Reporting Manager</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                   <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
                ) : (
                  filtered.map((u: any) => (
                    <tr key={u._id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{u.name || "Unnamed User"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0 border-opacity-50 ${roleColors[u.role.toLowerCase()] || ""}`}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">
                         {u.manager_id ? (
                           <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                 {u.manager_id?.name?.charAt(0) || "M"}
                              </div>
                              <span className="text-xs">{u.manager_id?.name || "Assigned Manager"}</span>
                           </div>
                         ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="p-4">
                         {u.is_active ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </div>
                         ) : (
                            <div className="flex items-center gap-1.5 text-amber-600 font-medium text-xs">
                               <div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending Invite
                            </div>
                         )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
