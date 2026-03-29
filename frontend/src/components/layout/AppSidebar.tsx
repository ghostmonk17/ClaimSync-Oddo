import {
  LayoutDashboard, Receipt, FileText, CheckSquare, Users, Settings, DollarSign, BarChart3, Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const roleMenus = {
  employee: [
    { title: "Dashboard", url: "/employee/dashboard", icon: LayoutDashboard },
    { title: "Expenses", url: "/employee/expenses", icon: Receipt },
    { title: "Reports", url: "/employee/reports", icon: FileText },
  ],
  manager: [
    { title: "Approvals", url: "/manager/approvals", icon: CheckSquare },
  ],
  finance: [
    { title: "Dashboard", url: "/finance/dashboard", icon: LayoutDashboard },
    { title: "Approvals", url: "/finance/approvals", icon: CheckSquare },
  ],
  cfo: [
    { title: "Dashboard", url: "/cfo/dashboard", icon: LayoutDashboard },
    { title: "Approvals", url: "/cfo/approvals", icon: CheckSquare },
  ],
  admin: [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Policy", url: "/admin/policy", icon: Shield },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Currency", url: "/admin/currency", icon: DollarSign },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ],
};

export function AppSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  if (!user) return null;

  const items = roleMenus[user.role] || [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-sidebar-foreground">ClaimSync</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
