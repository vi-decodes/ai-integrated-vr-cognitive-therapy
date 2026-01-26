import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MonitoringCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "yellow" | "lavender" | "blue" | "pink" | "mint";
  trend?: string;
}

const variantStyles = {
  yellow: "bg-pastel-yellow",
  lavender: "bg-pastel-lavender",
  blue: "bg-pastel-blue",
  pink: "bg-pastel-pink",
  mint: "bg-pastel-mint",
};

export function MonitoringCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "blue",
  trend 
}: MonitoringCardProps) {
  return (
    <Card className={`${variantStyles[variant]} border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-foreground/70">{trend}</span>
        )}
      </div>
      <h3 className="text-sm font-medium text-foreground/70 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-foreground/60">{subtitle}</p>
      )}
    </Card>
  );
}
