import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, UserCog, Mail, Briefcase } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout allowedRoles={["admin", "employee", "manager", "finance", "cfo"]}>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-card to-background/50">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                  <User size={32} />
                </div>
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="font-semibold px-2 py-0.5">
                      {user.role.toUpperCase()}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 group">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 group">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</p>
                  <p className="font-medium text-teal-600 dark:text-teal-400 font-bold">{user.company}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 group">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <UserCog size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manager / Supervisor</p>
                  <p className="font-medium text-primary font-bold">{user.manager}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 group">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Briefcase size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Designation</p>
                  <p className="font-medium italic text-muted-foreground">Standard {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>View your account status and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
               <div className="p-4 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Enhanced security for your workspace</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">RECOMMENDED</Badge>
               </div>
               
               <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-orange-700 dark:text-orange-400">Password Health</p>
                    <p className="text-xs text-orange-600/70 dark:text-orange-500/50">Your password was last changed 30 days ago</p>
                  </div>
                  <Badge variant="outline" className="border-orange-300 text-orange-600">FAIR</Badge>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
