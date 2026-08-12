import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Card, SectionHeader, TagChip, Avatar, ListRowsSkeleton } from "@/components/shared/primitives";import { useQuery } from "@tanstack/react-query";
import {
  activitiesService,
  dashboardService,
  buildersService,
  projectsService,
  flaresService,
  messagesService,
  notificationsService,
} from "@/services";
import { Card, SectionHeader, Avatar } from "@/components/shared/primitives";
import { dashboardService } from "@/services";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  FolderPlus,
  Flame,
  Users2,
  MessageSquare,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Sparkles,
  UserPlus,
  TrendingUp,
  Rocket,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { TypoCaption, TypoCard } from "@/components/shared/Typography";
import { motion, useReducedMotion } from "framer-motion";
import { containerVariants, cardEntrance, cardHover } from "@/lib/animations";

export function RecentActivity() {
  return (
<Card className="hover:shadow-md transition-shadow duration-200 flex flex-col h-full">      <div className="px-5 pt-5 pb-2 font-semibold flex items-center gap-2 text-sm">
        Recent Activity
      </div>
      <div className="flex-1 overflow-hidden">
        <ActivityFeed
          queryKey={["activities", "recent"]}
          queryFn={() => activitiesService.list(5)}
        />
      </div>
    </Card>
  );
}

export function BuilderRequests() {
const { data = [], isLoading } = useQuery({
    queryKey: ["builder-requests"],
    queryFn: dashboardService.builderRequests,
  });  return (
<Card className="hover:shadow-md transition-shadow duration-200">      <SectionHeader title="Builder Requests" action="View All" />
{isLoading && <ListRowsSkeleton rows={3} />}
      {!isLoading && (
      <ul className="divide-y divide-border/40">        {data.slice(0, 3).map((r) => (
          <li key={r.id} className="px-5 py-4 transition-colors hover:bg-muted/20">
            <div className="flex items-start gap-3">
              <Avatar src={r.builder.avatar} alt={r.builder.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{r.builder.name}</p>
                <p className="text-xs text-muted-foreground">{r.builder.role}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.builder.skills.slice(0, 3).map((s) => (
                    <TagChip key={s}>{s}</TagChip>
import { useQuery } from "@tanstack/react-query";
import {
  projectsService,
  buildersService,
  activitiesService,
  hackathonsService,
  notificationsService,
} from "@/services";

// Shared row treatment: a divider between rows instead of wrapping every
// row in its own bordered "card". Keeps lists visually grouped under a
// single container while still separating individual entries.
const ROW_CLASS =
  "flex items-center justify-between gap-4 py-3 border-b border-border/50 last:border-b-0 -mx-2 px-2 rounded-md transition-colors hover:bg-muted/10";

function SubDivider() {
  return <div className="border-t border-border/60" />;
}

// ---------------------------------------------------------------------------
// Projects & Suggestions — combines "Current Projects" and "AI Suggestions"
// into a single card. They were previously two separate cards; grouping
// them under one container with a divider keeps the related "what's
// relevant to me right now" info together without extra chrome.
// ---------------------------------------------------------------------------
export function ProjectsOverview() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
// 1. Current Projects
export function CurrentProjects() {
  const projectsList = [
    {
      id: "p1",
      name: "DevLink Platform",
      status: "In Progress",
      progress: 80,
      dueText: "Due in 5 days",
      iconText: "D",
      iconBg: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
      avatars: [
        "https://api.dicebear.com/9.x/notionists-neutral/svg?seed=Alex",
        "https://api.dicebear.com/9.x/notionists-neutral/svg?seed=Sarah",
      ],
      extraAvatars: 3,
    },
    {
      id: "p2",
      name: "AI Matching Engine",
      status: "In Progress",
      progress: 60,
      dueText: "Due in 12 days",
      iconText: "A",
      iconBg: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
      avatars: [
        "https://api.dicebear.com/9.x/notionists-neutral/svg?seed=Priya",
        "https://api.dicebear.com/9.x/notionists-neutral/svg?seed=John",
      ],
      extraAvatars: 2,
    },
    {
      id: "p3",
      name: "Mobile App",
      status: "Planning",
      progress: 25,
      dueText: "Due in 18 days",
      iconText: "M",
      iconBg: "bg-violet-500/10 text-violet-500 border border-violet-500/20",
      avatars: ["https://api.dicebear.com/9.x/notionists-neutral/svg?seed=David"],
      extraAvatars: 1,
    },
  ];
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: () => projectsService.list({ limit: 3 }),
  });

  const projectsList = projects.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    progress: p.progress,
    dueText: "Active", // Not part of the API model
    iconText: p.icon || p.name.charAt(0),
    iconBg: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    avatars: [
      `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${p.name}1`,
      `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${p.name}2`,
    ],
    extraAvatars: Math.max(0, p.members - 2),
  }));

  const { data: builders = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ["dashboard-ai-suggestions"],
    queryFn: () => buildersService.suggested(),
  });

  const suggestions = builders.slice(0, 3).map((b, i) => {
    // Generate some diverse suggestion badges for demo purposes
    const isTop = i === 0;
    const isEvent = i === 1;
    return {
      id: b.id,
      icon: isEvent ? Calendar : isTop ? User : TrendingUp,
      iconColor: isEvent
        ? "text-blue-500 bg-blue-500/10"
        : isTop
          ? "text-emerald-500 bg-emerald-500/10"
          : "text-amber-500 bg-amber-500/10",
      text: isEvent
        ? `${b.name} invited you to an event`
        : isTop
          ? `${b.name} matches your backend role`
          : `${b.name} liked your profile`,
      badge: isEvent ? "Event" : isTop ? `${b.matchScore || 95}% Match` : "Connect",
      badgeClass: isEvent
        ? "bg-blue-500/15 text-blue-500 border border-blue-500/20"
        : isTop
          ? "bg-success/15 text-success border border-success/20"
          : "bg-amber-500/15 text-amber-500 border border-amber-500/20",
    };
  });

  return (
    <Card className="border-border/60 rounded-2xl bg-card shadow-xs flex flex-col h-full">
      <SectionHeader title="Current Projects" action="View All" actionTo="/projects" />
      <div className="px-5 pb-4">
        {projectsLoading ? (
      <div className="flex-1 px-5 pb-5 pt-1 flex flex-col gap-4">
        {projectsList.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 shrink-0 rounded-lg text-sm font-bold",
                  p.iconBg,
                )}
              >
                {p.iconText}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                <TypoCaption as="p">{p.status}</TypoCaption>
              </div>
            </div>

            {/* Progress bar stack */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:flex flex-col items-end gap-1">
                <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <TypoCaption>{p.progress}%</TypoCaption>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {p.progress}%
                </span>
              </div>

              {/* Avatar stack */}
              <div className="flex -space-x-1.5 items-center shrink-0">
                {p.avatars.map((av, idx) => (
                  <Avatar
                    key={idx}
                    src={av}
                    alt="Team"
                    size={24}
                    className="border border-card ring-1 ring-border/20"
                  />
                ))}
                {p.extraAvatars > 0 && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border border-card text-[9px] font-semibold text-muted-foreground ring-1 ring-border/20">
                    +{p.extraAvatars}
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 my-1.5 rounded-lg bg-muted/50 animate-pulse" />
          ))
        ) : projectsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <p className="text-sm">No projects found</p>
          </div>
        ) : (
          projectsList.map((p) => (
            <div key={p.id} className={ROW_CLASS}>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex items-center justify-center h-10 w-10 shrink-0 rounded-lg text-sm font-bold",
                    p.iconBg,
                  )}
                >
                  {p.iconText}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{p.status}</p>
                </div>
              </div>

              {/* Progress bar stack */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex flex-col items-end gap-1">
                  <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {p.progress}%
                  </span>
                </div>

                {/* Avatar stack */}
                <div className="flex -space-x-1.5 items-center shrink-0">
                  {p.avatars.map((av, idx) => (
                    <Avatar
                      key={idx}
                      src={av}
                      alt="Team"
                      size={24}
                      className="border border-card ring-1 ring-border/20"
                    />
                  ))}
                  {p.extraAvatars > 0 && (
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border border-card text-[9px] font-semibold text-muted-foreground ring-1 ring-border/20">
                      +{p.extraAvatars}
                    </div>
                  )}
                </div>

                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:inline">
                  {p.dueText}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors">
                Accept
              </button>
              <button className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                Decline
              </button>
            </div>
          </li>
        ))}
</ul>
      )}
    </Card>  );
}

              <TypoCaption>
                {p.dueText}
              </TypoCaption>
export function InviteRequests() {
const { data = [], isLoading } = useQuery({
    queryKey: ["invite-requests"],
    queryFn: dashboardService.inviteRequests,
  });  return (
<Card className="hover:shadow-md transition-shadow duration-200">      <SectionHeader title="Invite Requests" action="View All" />
      <ul className="divide-y divide-border/40">
        {data.slice(0, 3).map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{r.project}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.role}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Due in {r.dueDays} days · By {r.by}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button className="flex items-center justify-center h-8 w-8 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors">
                <Check size={14} />
              </button>
              <button className="flex items-center justify-center h-8 w-8 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                <X size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
          ))
        )}
      </div>

      <SubDivider />

      <SectionHeader title="AI Suggestions" action="View All" actionTo="/builders" />
      <div className="px-5 pb-5">
        {suggestionsLoading ? (
      <div className="flex-1 px-5 pb-5 pt-1 flex flex-col gap-4">
        {suggestions.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border/40 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                    s.iconColor,
                  )}
                >
                  <Icon size={16} />
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 my-1.5 rounded-lg bg-muted/50 animate-pulse" />
          ))
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <p className="text-sm">No suggestions yet</p>
          </div>
        ) : (
          suggestions.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className={ROW_CLASS}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                      s.iconColor,
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate">{s.text}</p>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    s.badgeClass,
                  )}
                >
                  {s.badge}
                </span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                  s.badgeClass,
                )}
              >
                {s.badge}
              </span>
            </div>
          );
        })}
            );
          })
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Activity — combines "Quick Actions", "Recent Activity" and "Upcoming"
// (previously three separate cards) into one card with dividers between
// each grouped section.
// ---------------------------------------------------------------------------
export function ActivityOverview() {
  const actions = [
    {
      label: "Create Project",
      icon: Plus,
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
      border: "border-blue-100 dark:border-blue-900/40",
      color: "text-blue-600 dark:text-blue-400",
      to: "/projects" as const,
    },
    {
      label: "Publish Flare",
      icon: Flame,
      bg: "bg-orange-50/50 dark:bg-orange-950/20",
      border: "border-orange-100 dark:border-orange-900/40",
      color: "text-orange-600 dark:text-orange-400",
      to: "/flares" as const,
    },
    {
      label: "Find Builders",
      icon: Users2,
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      border: "border-emerald-100 dark:border-emerald-900/40",
      color: "text-emerald-600 dark:text-emerald-400",
      to: "/builders" as const,
    },
    {
      label: "Messages",
      icon: MessageSquare,
      bg: "bg-purple-50/50 dark:bg-purple-950/20",
      border: "border-purple-100 dark:border-purple-900/40",
      color: "text-purple-600 dark:text-purple-400",
      to: "/messages" as const,
    },
  ];

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
// 3. Quick Actions
export function QuickActions() {
  const { data = [] } = useQuery({
    queryKey: ["quick-actions"],
    queryFn: dashboardService.quickActions,
  });

  const getIcon = (name: string) => {
    switch (name) {
      case "FolderPlus":
        return FolderPlus;
      case "Users2":
        return Users2;
      case "Flame":
        return Flame;
      case "UserPlus":
        return UserPlus;
      default:
        return FolderPlus;
    }
  };

  return (
    <Card className="border-border/60 bg-transparent shadow-none border-none">
      <div className="grid grid-cols-2 gap-4">
        {data.map((a) => {
          const Icon = getIcon(a.iconName);
          return (
            <Link
              key={a.label}
              to={a.to}
              className="group flex flex-col items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
<Card className="hover:shadow-md transition-shadow duration-200">      <SectionHeader title="Suggested Builders" action="View All" actionTo="/builders" />
{isLoading && <ListRowsSkeleton rows={3} />}
      {!isLoading && (
      <motion.div
        className="grid grid-cols-1 gap-4 p-5 pt-2 sm:grid-cols-2 lg:grid-cols-3"        variants={containerVariants}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        {data.slice(0, 3).map((b, i) => {
          const visibleSkills = b.skills.slice(0, 2);
          const hiddenSkillsCount = b.skills.length - visibleSkills.length;
          return (
            <motion.div
              key={b.id}
              variants={prefersReducedMotion ? undefined : cardEntrance}
              custom={i}
className="flex flex-col h-full rounded-3xl border border-border/40 bg-surface p-5 hover:border-border hover:shadow-sm transition-all"            >
              <div className="flex items-start justify-between gap-2">
                <Avatar
                  src={b.avatar}
                  alt={b.name}
                  size={48}
                  online={b.online}
                  className="shadow-sm"
                />
                <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success border border-success/20">
                  {b.matchScore}% Match
                </span>
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {b.role} · {b.country}
                </p>
              </div>
              <div className="mt-4 mb-4 flex flex-wrap gap-1.5 flex-1 items-start content-start">
                {visibleSkills.map((s) => (
                  <TagChip key={s}>{s}</TagChip>
                ))}
                {hiddenSkillsCount > 0 && (
                  <span className="inline-flex items-center rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    +{hiddenSkillsCount}
                  </span>
    <Card className="border-border/60 rounded-2xl bg-card shadow-xs flex flex-col h-full">
      <div className="px-5 pt-5 pb-2 font-semibold text-sm text-foreground">Quick Actions</div>
      <div className="grid grid-cols-2 gap-3 p-4 pt-1 flex-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              to={act.to}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 text-center cursor-pointer",
                act.bg,
                act.border,
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-xl bg-card shadow-2xs border border-border/20",
                  act.color,
                )}
              >
                <Icon size={20} />
              </span>
              <span className="text-sm font-semibold text-foreground">{a.label}</span>
            </Link>
          );
        })}      </div>
        })}
</motion.div>
      )}
    </Card>  );
}

export function TrendingProjects() {
  const { data = [] } = useQuery({ queryKey: ["trending"], queryFn: projectsService.trending });
  return (
<Card className="hover:shadow-md transition-shadow duration-200">      <SectionHeader title="Trending Projects" action="View All" actionTo="/projects" />
      <ul className="divide-y divide-border/40">
        {data.slice(0, 4).map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
          >
            <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg bg-muted text-lg border border-border/50">
              {p.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground mt-0.5">{p.stack.join(" · ")}</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star size={14} className="text-muted-foreground" /> {p.stars}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={14} className="text-muted-foreground" /> {p.forks}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
      </div>
    </Card>
  );
}

// 7. Upcoming Events (Sidebar Widget)

// 4. Recent Activity
export function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: () => activitiesService.list(4),
  });

  const activityList = activities.slice(0, 4).map((a, i) => {
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500"];
    return {
      id: a.id,
      bulletColor: colors[i % colors.length],
      text: a.title || "Unknown activity",
      time: new Date(a.created_at).toLocaleDateString(),
    };
  });

  const { data: hackathons = [], isLoading: upcomingLoading } = useQuery({
  return (
<Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">      <SectionHeader title="AI Insights" />
      <div className="space-y-4 px-5 pb-5">
        <p className="text-sm text-foreground leading-relaxed">
          You need a <span className="font-semibold">Backend Developer</span> for your project{" "}
          <span className="font-semibold text-primary">AI Chatbot</span>
        </p>
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
            Top Match
          </p>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <Avatar
                src="https://api.dicebear.com/9.x/notionists-neutral/svg?seed=Rahul"
                alt="Rahul"
                size={44}
                className="shadow-sm border border-primary/20"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">Rahul Verma</p>
                <p className="text-xs text-muted-foreground mt-0.5">Full Stack Developer</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                  <Sparkles size={12} /> 93% Match
                </span>
              </div>
              <button className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors shadow-sm flex items-center justify-center gap-2">
                <Check size={16} /> Invite to Project
              </button>
            </div>
    <Card className="border-border/60 rounded-2xl bg-card shadow-xs flex flex-col h-full">
      <SectionHeader title="Recent Activity" action="View All" actionTo="/dashboard" />
      <div className="flex-1 px-5 pb-5 pt-1 flex flex-col gap-3">
        {activities.map((act) => (
          <Link
            key={act.id}
            to="/dashboard"
            className="flex items-center justify-between gap-4 p-2.5 rounded-lg border border-transparent hover:border-border/40 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("h-2 w-2 rounded-full shrink-0", act.bulletColor)} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{act.text}</p>
                <TypoCaption as="p">{act.time}</TypoCaption>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg border border-transparent bg-muted/30 animate-pulse"
            />
          ))
        ) : activityList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <p className="text-xs">No recent activity</p>
          </div>
        ) : (
          activityList.map((act) => (
            <Link
              key={act.id}
              to="/dashboard"
              className="flex items-center justify-between gap-4 p-2.5 rounded-lg border border-transparent hover:border-border/40 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("h-2 w-2 rounded-full shrink-0", act.bulletColor)} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{act.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}

// 5. Upcoming (Center list widget)
export function Upcoming() {
  const { data: hackathons = [], isLoading } = useQuery({
    queryKey: ["dashboard-upcoming"],
    queryFn: () => hackathonsService.list(),
  });

  const upcomingList = hackathons.slice(0, 3).map((h, i) => {
    const colors = [
      "text-rose-500 bg-rose-500/10",
      "text-blue-500 bg-blue-500/10",
      "text-emerald-500 bg-emerald-500/10",
    ];
    return {
      id: h.id,
      title: h.name,
      time: new Date(h.starts_at).toLocaleDateString(),
      icon: Calendar,
      iconColor: colors[i % colors.length],
    };
  });

  return (
<Card className="hover:shadow-md transition-shadow duration-200">      <SectionHeader title="Messages" action="View All" actionTo="/messages" />
      <ul className="divide-y divide-border/40">
        {data.slice(0, 4).map((c) => (
          <li key={c.id}>
            <Link
              to="/messages/$conversationId"
              params={{ conversationId: c.id }}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/20"
            >
              <Avatar src={c.with.avatar} alt={c.with.name} size={36} online={c.with.online} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{c.with.name}</p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">{c.preview}</p>
    <Card className="border-border/60 rounded-2xl bg-card shadow-xs flex flex-col h-full">
      <div className="px-5 pt-5 pb-2 font-semibold text-sm text-foreground">Quick Actions</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              to={act.to}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 text-center cursor-pointer",
                act.bg,
                act.border,
              )}
            >
      <SectionHeader title="Upcoming" action="View All" actionTo="/dashboard" />
      <div className="flex-1 px-5 pb-5 pt-1 flex flex-col gap-3">
        {upcomingList.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40"
            >
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                  item.iconColor,
                )}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                <TypoCaption as="p">{item.time}</TypoCaption>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg border border-border/40 bg-muted/30 animate-pulse"
            />
          ))
        ) : upcomingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <p className="text-xs">No upcoming events</p>
          </div>
        ) : (
          upcomingList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-xl bg-card shadow-2xs border border-border/20",
                  act.color,
                )}
              >
                <Icon size={20} />
              </div>
              <span className="text-xs font-bold text-foreground">{act.label}</span>
            </Link>
          );
        })}
      </div>

      <SubDivider />

      <div className="grid sm:grid-cols-2">
        <div className="sm:border-r sm:border-border/60">
          <SectionHeader title="Recent Activity" action="View All" actionTo="/dashboard" />
          <div className="px-5 pb-5">
            {activitiesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 my-1.5 rounded-lg bg-muted/30 animate-pulse" />
              ))
            ) : activityList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <p className="text-xs">No recent activity</p>
              </div>
            ) : (
              activityList.map((act) => (
                <Link key={act.id} to="/dashboard" className={cn(ROW_CLASS, "group")}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", act.bulletColor)} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{act.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <SectionHeader title="Upcoming" action="View All" actionTo="/dashboard" />
          <div className="px-5 pb-5">
            {upcomingLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 my-1.5 rounded-lg bg-muted/30 animate-pulse" />
              ))
            ) : upcomingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <p className="text-xs">No upcoming events</p>
              </div>
            ) : (
              upcomingList.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className={ROW_CLASS}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                          item.iconColor,
                        )}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sidebar updates — combines "Notifications" and "Upcoming Events"
// (previously two separate cards) into one card with a divider between them.
// ---------------------------------------------------------------------------
export function SidebarUpdates() {
  const { data: rawNotifications = [], isLoading: notificationsLoading } = useQuery({

// 6. Notifications (Sidebar Widget)
export function NotificationsWidget() {
  const { data: rawNotifications = [], isLoading } = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: () => notificationsService.list(),
  });

  const notifications = rawNotifications.slice(0, 4).map((n, i) => {
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500"];
    return {
      id: n.id || `n${i}`,
      dotColor: colors[i % colors.length],
      text: n.title,
      time: n.created_at ? new Date(n.created_at).toLocaleDateString() : "Recently",
    };
  });

  const { data: hackathons = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["dashboard-upcoming-events"],
    queryFn: () => hackathonsService.list(),
  });

  const events = hackathons.slice(0, 3).map((h, i) => {
    const colors = [
      "text-rose-500 bg-rose-500/10",
      "text-blue-500 bg-blue-500/10",
      "text-violet-500 bg-violet-500/10",
    ];
    return {
      id: h.id,
      title: h.name,
      time: new Date(h.starts_at).toLocaleDateString(),
      iconColor: colors[i % colors.length],
    };
  });

  return (
<Card className="bg-transparent shadow-none border-none">      
  <div className="grid grid-cols-2 gap-4">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
className="group flex flex-col items-start gap-4 rounded-3xl border border-border/40 bg-card p-5 transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"          >
            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <a.icon size={20} />
            </span>
            <span className="text-sm font-semibold text-foreground">{a.label}</span>
          </Link>
        ))}
    <Card className="border-border/60 rounded-2xl bg-card shadow-xs flex flex-col">
      <SectionHeader title="Notifications" action="View All" actionTo="/dashboard" />
      <div className="px-5 pb-4 flex flex-col gap-3.5">
        {notificationsLoading ? (
      <div className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 min-w-0">
            <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 mt-1", n.dotColor)} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">{n.text}</p>
              <TypoCaption as="p">{n.time}</TypoCaption>
            </div>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-muted/30 animate-pulse" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
            <p className="text-xs">You have no notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 min-w-0">
              <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 mt-1", n.dotColor)} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight">{n.text}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <SubDivider />

      <SectionHeader title="Upcoming Events" action="View All" actionTo="/dashboard" />
      <div className="px-5 pb-5 flex flex-col gap-3.5">
        {eventsLoading ? (
  const events = hackathons.slice(0, 3).map((h, i) => {
    const colors = [
      "text-rose-500 bg-rose-500/10",
      "text-blue-500 bg-blue-500/10",
      "text-violet-500 bg-violet-500/10",
    ];
    return {
      id: h.id,
      title: h.name,
      time: new Date(h.starts_at).toLocaleDateString(),
      iconColor: colors[i % colors.length],
    };
  });

  return (
<Card className="hover:shadow-md transition-shadow duration-200">      <SectionHeader title="Deadlines" action="Calendar" />
      <ul className="divide-y divide-border/40">
        {data.slice(0, 3).map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/20"
          >
            <div className="h-2 w-2 rounded-full bg-border" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{d.project}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{d.milestone}</p>
    <Card className="border-border/60 rounded-2xl bg-card shadow-xs flex flex-col">
      <SectionHeader title="Upcoming Events" action="View All" actionTo="/dashboard" />
      <div className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                e.iconColor,
              )}
            >
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{e.title}</p>
              <TypoCaption as="p">{e.time}</TypoCaption>
            </div>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
          ))
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
            <p className="text-xs">No upcoming events</p>
          </div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                  e.iconColor,
                )}
              >
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{e.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{e.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Upgrade Plan CTA — kept as its own card since it is a distinct promo
// banner, not a list of information that can be grouped with other widgets.
// ---------------------------------------------------------------------------
export function UpgradePlanCTA() {
  return (
<Card className="hover:shadow-md transition-shadow duration-200">      <SectionHeader title="Notifications" action="View All" actionTo="/notifications" />
      <ul className="divide-y divide-border/40">
        {data.slice(0, 4).map((n) => (
          <li
            key={n.id}
            className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/20"
          >
            <span
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                n.unread ? "bg-primary" : "bg-transparent",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{n.text}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.ago}</p>
            </div>
          </li>
        ))}
      </ul>
    <Card className="border-border/60 rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 shadow-xs p-5 relative overflow-hidden flex items-center gap-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,183,215,0.04),transparent_60%)] pointer-events-none" />

      <div className="flex items-center justify-center h-12 w-12 rounded-xl shrink-0 bg-primary/10 text-primary relative z-10">
        <Rocket size={24} className="animate-bounce" />
      </div>

      <div className="min-w-0 flex-1 relative z-10">
        <TypoCard>Upgrade your plan</TypoCard>
        <TypoCaption as="p">
          Unlock premium features and boost your productivity.
        </TypoCaption>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-2 cursor-pointer"
        >
          Upgrade Now <ChevronRight size={12} />
        </Link>
      </div>
    </Card>
  );
}