import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <div className="bg-card border rounded-lg p-5 shadow-sm space-y-5">
          <h2 className="font-medium">Company Information</h2>
          <div className="grid gap-4">
            <div><Label>Company Name</Label><Input defaultValue="Acme Corp" className="mt-1.5" /></div>
            <div><Label>Admin Email</Label><Input type="email" defaultValue="admin@acme.com" className="mt-1.5" /></div>
          </div>
          <Button>Save Changes</Button>
        </div>

        <div className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
          <h2 className="font-medium">Notifications</h2>
          <div className="flex items-center justify-between">
            <div><p className="text-sm">Email notifications for new expenses</p><p className="text-xs text-muted-foreground">Notify managers when expenses are submitted</p></div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm">Policy violation alerts</p><p className="text-xs text-muted-foreground">Alert finance team of flagged expenses</p></div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
