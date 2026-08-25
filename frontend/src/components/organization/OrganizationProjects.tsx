"use client";

import { Card } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services";

type Project = {
  id: string;
  name: string;
  category: string;
  description: string;
  website?: string;
  repoUrl?: string;
};

type OrganizationProjectsProps = {
  organizationId?: string;
};

export function OrganizationProjects({ organizationId }: OrganizationProjectsProps = {}) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["organization", "projects", organizationId],
    queryFn: () => organizationService.projects(),
  });

  if (isLoading) {
    return (
      <Card className="p-8 md:p-12 border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Projects</h2>
          <div className="flex items-center justify-between">
            <span className="animate-pulse h-4 w-4 rounded-md bg-muted" />
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">Loading projects...</p>
        </div>
      </Card>
    );
  }

  const projects: Project[] = data as Project[];

  return (
    <Card className="p-8 md:p-12 border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">Projects</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border-border p-6 rounded-xl border-border bg-card transition-colors hover:bg-primary/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="rounded-md bg-primary/10 p-2">
                  <i className="lucide lucide-folder" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{project.name}</h3>
                  <p className="text-muted-foreground text-sm">{project.category}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2">{project.description}</p>
              {project.website ||
                (project.repoUrl && (
                  <div className="mt-4 flex gap-2">
                    {project.website && (
                      <a
                        href={project.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        <i className="lucide lucide-link-2" /> Website
                      </a>
                    )}
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        <i className="lucide lucide-git-branch" /> repo
                      </a>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
