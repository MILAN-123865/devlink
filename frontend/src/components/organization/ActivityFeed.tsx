"use client";

import { Card } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services";

type ActivityItem = {
  id: string;
  type: "join" | "project" | "hire" | "update";
  title: string;
  description: string;
  ago: string;
  icon: keyof typeof import("lucide-react");
};

type OrganizationActivityFeedProps = {
  organizationId?: string;
};

export function OrganizationActivityFeed({ organizationId }: OrganizationActivityFeedProps = {}) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["organization", "activity", organizationId],
    queryFn: () => organizationService.activity(),
  });

  if (isLoading) {
    return (
      <Card className="p-8 md:p-12 border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Activity Feed</h2>
          <div className="flex items-center justify-between">
            <span className="animate-pulse h-4 w-4 rounded-md bg-muted" />
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">Loading activity...</p>
        </div>
      </Card>
    );
  }

  const activities: ActivityItem[] = data as ActivityItem[];

  return (
    <Card className="p-8 md:p-12 border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">Activity Feed</h2>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-xl border-border bg-primary/5"
            >
              <div className="flex-shrink-0">
                <i className={`lucide lucide-${activity.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{activity.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.ago}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
