import { Card } from "@/components/shared/primitives";
import {
  Folder,
  Users2,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { TypoCaption } from "@/components/shared/Typography";

const statsData = [
  {
    key: "active-projects",
    value: "2",
    label: "Active Projects",
    trend: "+ 20% from last week",
    positive: true,
    icon: Folder,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    key: "team-members",
    value: "24",
    label: "Team Members",
    trend: "+ 8% from last week",
    positive: true,
    icon: Users2,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    key: "unread-messages",
    value: "3",
    label: "Unread Messages",
    trend: "- 25% from last week",
    positive: false,
    icon: MessageSquare,
    iconColor: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    key: "ai-score",
    value: "85",
    label: "AI Score",
    trend: "+ 15% from last week",
    positive: true,
    icon: Sparkles,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services";

export function StatsRow() {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.stats(),
  });

  const getStat = (key: string) => stats.find((s: any) => s.key === key)?.value;

  const statsData = [
    {
      key: "active-projects",
      value: getStat("projects") ?? 0,
      label: "Active Projects",
      trend: "+ 20% from last week",
      positive: true,
      icon: Folder,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      key: "team-members",
      value: getStat("builders") ?? 0,
      label: "Team Members",
      trend: "+ 8% from last week",
      positive: true,
      icon: Users2,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      key: "unread-messages",
      value: getStat("messages") ?? 0,
      label: "Unread Messages",
      trend: "- 25% from last week",
      positive: false,
      icon: MessageSquare,
      iconColor: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      key: "ai-score",
      value:
        typeof getStat("ai") === "string"
          ? parseInt((getStat("ai") as string).replace("%", ""))
          : (getStat("ai") ?? 0),
      label: "AI Score",
      trend: "+ 15% from last week",
      positive: true,
      icon: Sparkles,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="h-[104px] rounded-2xl p-5 border-border/60 bg-card shadow-xs animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">      {primaryStats.map((s, i) => {
        const Icon = iconMap[s.icon] ?? Folder;
        const trend = trends[i];
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statsData.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="h-full"
          >
            <Card
              interactive
className="flex flex-col h-full gap-3 p-4 transition-all duration-200 hover:border-border hover:shadow-md"            >
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground p-1.5 rounded-lg bg-muted/30">
                  <Icon size={16} />
                </span>
            <Card className="flex flex-col h-full gap-3.5 rounded-2xl p-5 border-border/60 bg-card shadow-xs">
              <div className="flex items-center gap-4">
                {/* Left Side: Circular Icon container */}
                <div
                  className={`flex items-center justify-center h-12 w-12 rounded-xl shrink-0 ${s.bgColor} ${s.iconColor}`}
                >
                  <Icon size={20} />
                </div>
                {/* Right Side: Stack of value and label */}
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
                    {s.value}
                  </p>
                  <TypoCaption as="p">
                    {s.label}
                  </TypoCaption>
                </div>
              </div>

              {/* Bottom: Trend indicator */}
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/40">
                <span
                  className={`inline-flex items-center text-[11px] font-semibold ${s.positive ? "text-success" : "text-destructive"}`}
                >
                  {s.positive ? (
                    <ArrowUpRight size={14} className="mr-0.5" />
                  ) : (
                    <ArrowDownRight size={14} className="mr-0.5" />
                  )}
                  {s.trend}
                </span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
