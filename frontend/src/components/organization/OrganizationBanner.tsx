"use client";

import { Card } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";

type OrganizationBannerProps = {
  name: string;
  tagline: string;
  logoUrl: string;
};

export function OrganizationBanner({ name, tagline, logoUrl }: OrganizationBannerProps) {
  return (
    <Card className="p-8 md:p-12 border-border bg-primary/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative rounded-full border-border w-16 h-16 overflow-hidden">
              <img src={logoUrl} alt={name} className="h-full w-full rounded-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          </div>
          <p className="text-base text-muted-foreground">{tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="col-span-2">
            <p className="text-muted-foreground text-sm">
              {membersCount} team members • {projectsCount} projects • {activeUsers} active users
            </p>
          </div>
          <div>
            <Button variant="outline" size="sm" className="mt-2">
              View Team
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

const membersCount = 15;
const projectsCount = 23;
const activeUsers = 3421;
