import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "bg-card",
  primary: "bg-card border-l-4 border-l-primary",
  success: "bg-card border-l-4 border-l-success",
  warning: "bg-card border-l-4 border-l-warning",
  destructive: "bg-card border-l-4 border-l-destructive",
};

export function StatCard({ title, value, subtitle, icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border p-5 shadow-sm", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && <p className="text-xs text-success mt-1">{trend}</p>}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </div>
  );
}
