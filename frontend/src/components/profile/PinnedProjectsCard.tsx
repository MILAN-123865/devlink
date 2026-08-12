import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Star, Eye, Pin } from "lucide-react";
import { pinnedProjectsApi, type PinnedProject } from "@/api/modules/pinnedProjects";
import { Card, Skeleton, TagChip } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";

interface PinnedProjectsCardProps {
  username: string;
  /** Show the empty-state prompt. Only useful on your own profile. */
  isOwnProfile?: boolean;
  className?: string;
}

function PinnedProjectRow({ pin }: { pin: PinnedProject }) {
  const project = pin.project;
  if (!project) return null;

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="block rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">{project.title}</p>
          {project.tagline ? (
            <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
              {project.tagline}
            </p>
          ) : null}
        </div>
        {project.stage ? <TagChip className="shrink-0 capitalize">{project.stage}</TagChip> : null}
      </div>

      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3" aria-hidden="true" />
          {project.stars}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3 w-3" aria-hidden="true" />
          {project.views}
        </span>
      </div>
    </Link>
  );
}

export function PinnedProjectsCard({
  username,
  isOwnProfile = false,
  className,
}: PinnedProjectsCardProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pinned-projects", username],
    queryFn: () => pinnedProjectsApi.getForUser(username),
    staleTime: 60 * 1000,
    retry: 1,
  });

  // A profile with nothing pinned should not grow an empty card for visitors —
  // only the owner needs the nudge to pin something.
  const hasPins = (data?.items.length ?? 0) > 0;
  if (!isLoading && !isError && !hasPins && !isOwnProfile) return null;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-2">
        <Pin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <p className="text-[13px] font-semibold text-foreground">Pinned Projects</p>
      </div>

      {isLoading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {isError ? (
        <p className="mt-3 text-[12px] text-muted-foreground">
          Pinned projects are unavailable right now.
        </p>
      ) : null}

      {!isLoading && !isError && !hasPins ? (
        <p className="mt-3 text-[12px] text-muted-foreground">
          Nothing pinned yet. Pin up to {data?.max_pins ?? 6} projects to feature them at the top of
          your profile.
        </p>
      ) : null}

      {hasPins ? (
        <div className="mt-3 space-y-2">
          {data!.items.map((pin) => (
            <PinnedProjectRow key={pin.id} pin={pin} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export default PinnedProjectsCard;
