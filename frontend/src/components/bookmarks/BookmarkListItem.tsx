import type { ReactNode } from "react";
import { Avatar, TagChip } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";

/**
 * A single compact row inside a bookmarks list. Replaces the old grid of
 * large cards — one row per saved item, with the primary content on the
 * left (usually wrapped in a `Link` by the caller) and hover-revealed
 * actions on the right, kept as siblings so they never conflict with the
 * row's own link.
 */
export function BookmarkListItem({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border-b border-border/50 px-2 py-2.5 -mx-2 last:border-b-0 transition-colors hover:bg-muted/30",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {actions && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * Shared avatar/title/subtitle/tags layout used inside a `BookmarkListItem`.
 * Keeps every saved-item row (developers, projects, repositories, posts)
 * visually consistent.
 */
export function BookmarkRowContent({
  avatarSrc,
  icon,
  title,
  subtitle,
  badge,
  tags,
  meta,
}: {
  avatarSrc?: string | null;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  tags?: string[];
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {avatarSrc !== undefined ? (
        <Avatar src={avatarSrc} alt={title} size={36} />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-base">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-foreground">{title}</p>
          {badge}
        </div>
        {subtitle && <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>}
        {tags && tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <TagChip key={t} className="px-1.5 py-0 text-[10px]">
                {t}
              </TagChip>
            ))}
          </div>
        )}
      </div>
      {meta && <div className="shrink-0 text-[11px] text-muted-foreground">{meta}</div>}
    </div>
  );
}
