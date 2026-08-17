"use client";

import { Card } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/primitives";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  joinedAt: string;
};

type OrganizationTeamsProps = {
  organizationId?: string;
};

export function OrganizationTeams({ organizationId }: OrganizationTeamsProps = {}) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["organization", "teams", organizationId],
    queryFn: () => organizationService.members(),
  });

  if (isLoading) {
    return (
      <Card className="p-8 md:p-12 border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Teams</h2>
            <div className="space-x-2">
              <span className="animate-pulse h-4 w-4 rounded-md bg-muted" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">Loading team members...</p>
        </div>
      </Card>
    );
  }

  const members: TeamMember[] = data;

  return (
    <Card className="p-8 md:p-12 border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">Teams</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="border-border p-6 rounded-xl border-border bg-card transition-colors hover:bg-primary/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={member.avatar} alt={member.name} size={48} />
                <div>
                  <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
                  <p className="text-muted-foreground text-sm">{member.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {member.department} • Joined {member.joinedAt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
