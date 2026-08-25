"use client";

import { Card } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { organizationService } from "@/services";

type Opening = {
  id: string;
  title: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  description?: string;
};

type OrganizationHiringProps = {
  organizationId?: string;
};

export function OrganizationHiring({ organizationId }: OrganizationHiringProps = {}) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["organization", "openings", organizationId],
    queryFn: () => organizationService.openings(),
  });

  if (isLoading) {
    return (
      <Card className="p-8 md:p-12 border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Open Positions</h2>
          <div className="flex items-center justify-between">
            <span className="animate-pulse h-4 w-4 rounded-md bg-muted" />
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">Loading open positions...</p>
        </div>
      </Card>
    );
  }

  const openings: Opening[] = data as Opening[];

  return (
    <Card className="p-8 md:p-12 border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">Open Positions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {openings.map((opening) => (
            <div
              key={opening.id}
              className="border-border p-6 rounded-xl border-border bg-card transition-colors hover:bg-primary/5"
            >
              <Briefcase className="w-6 h-6 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground">{opening.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{opening.location}</p>
              <p className="text-[11px] text-primary font-medium uppercase tracking-wider">
                {opening.type}
              </p>
              {opening.description && (
                <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                  {opening.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
