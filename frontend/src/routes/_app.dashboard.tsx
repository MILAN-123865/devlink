import { createFileRoute } from "@tanstack/react-router";
import { GreetingHero } from "@/features/dashboard/GreetingHero";
import { StatsRow } from "@/features/dashboard/StatsRow";
import {
  ProjectsOverview,
  ActivityOverview,
  SidebarUpdates,
  UpgradePlanCTA,
} from "@/features/dashboard/sections";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DevLink" },
      {
        name: "description",
        content: "Your DevLink command center: projects, matches, messages and streaks.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
<div className="mx-auto flex max-w-[1536px] w-full flex-col gap-8 pb-12 pt-6 px-4 sm:px-6">      <GreetingHero />

      <StatsRow />

      {/* Main Grid Grouping */}
<div className="grid gap-8 lg:grid-cols-12 items-start">        {/* Left/Main Column - 8 cols */}
<div className="lg:col-span-8 flex flex-col gap-8">          <SuggestedBuilders />
          <TrendingProjects />
<div className="grid gap-8 sm:grid-cols-2">            <BuilderRequests />
            <InviteRequests />
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <MessagesPreview />
      {/* Main Grid Grouping (2-column layout on desktop) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left/Main Column - 9 cols */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <ProjectsOverview />
          <ActivityOverview />
        </div>

        {/* Right Sidebar - 4 cols */}
<div className="lg:col-span-4 flex flex-col gap-8">          <QuickActions />
          <AIRecommendations />
          <UpcomingDeadlines />
          <NotificationsFeed />
        {/* Right Sidebar - 3 cols */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <SidebarUpdates />
          <UpgradePlanCTA />
        </div>
      </div>
    </div>
  );
}
