import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label?: string };
  accent?: "primary" | "accent" | "success" | "warning" | "destructive" | "secondary";
  className?: string;
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-[hsl(38_75%_35%)]",
  destructive: "text-destructive",
  secondary: "text-secondary-foreground",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "primary", className }: StatCardProps) {
  return (
    <Card className={cn("border-border shadow-none", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                trend.value >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {trend.value >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0 opacity-70", accentClasses[accent])} />
      </CardContent>
    </Card>
  );
}
