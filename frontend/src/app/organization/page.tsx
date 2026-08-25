"use client";

import { Card } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { OrganizationBanner } from "@/components/organization/OrganizationBanner";
import { OrganizationMembers } from "@/components/organization/OrganizationMembers";
import { OrganizationProjects } from "@/components/organization/OrganizationProjects";
import { OrganizationHiring } from "@/components/organization/OrganizationHiring";
import { OrganizationActivityFeed as ActivityFeed } from "@/components/organization/ActivityFeed";
import { OrganizationAnalytics } from "@/components/organization/OrganizationAnalytics";
import { OrganizationTeams } from "@/components/organization/OrganizationTeams";

export default function OrganizationProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Card className="p-0">
        <OrganizationBanner
          name="DevLink Labs"
          tagline="Building the network for developers"
          logoUrl="https://devlink.io/logo.svg"
        />
        <OrganizationTeams />
        <OrganizationMembers />
        <OrganizationProjects />
        <OrganizationHiring />
        <ActivityFeed />
        <OrganizationAnalytics />
      </Card>
    </div>
  );
}
