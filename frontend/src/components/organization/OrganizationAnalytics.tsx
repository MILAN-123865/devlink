"use client";

import { Card } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services";

type Stat = {
  label: string;
  value: string | number;
  icon: keyof typeof import("lucide-react");
};

type OrganizationAnalyticsProps = {
  organizationId?: string;
};

export function OrganizationAnalytics({ organizationId }: OrganizationAnalyticsProps = {}) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["organization", "analytics", organizationId],
    queryFn: () => organizationService.get(),
  });

  if (isLoading) {
    return (
      <Card className="p-8 md:p-12 border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Analytics</h2>
          <div className="flex items-center justify-between">
            <span className="animate-pulse h-4 w-4 rounded-md bg-muted" />
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">Loading analytics...</p>
        </div>
      </Card>
    );
  }

  const stats: Stat[] = data as Stat[];

  return (
    <Card className="p-8 md:p-12 border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">Analytics</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-border p-6 rounded-xl border-border bg-card transition-colors hover:bg-primary/5"
            >
              <i className={`lucide lucide-${stat.icon}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
