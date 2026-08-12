import { api } from "../client";
import type { ActivityType } from "./activities";

/** One cell of the contribution grid. */
export interface HeatmapDay {
  /** ISO `YYYY-MM-DD`, UTC. */
  day: string;
  count: number;
  /** 0 = nothing happened; 1-4 are quartiles of this user's own activity. */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface StreakSummary {
  /**
   * Consecutive active days ending today *or* yesterday — an unstarted day
   * does not read as a broken streak.
   */
  current_streak: number;
  longest_streak: number;
  longest_streak_start: string | null;
  longest_streak_end: string | null;
  total_activities: number;
  active_days: number;
  total_days: number;
  busiest_day: string | null;
  busiest_day_count: number;
  daily_average: number;
  active_day_average: number;
}

export interface ActivityTypeCount {
  activity_type: ActivityType | string;
  count: number;
}

export interface ActivityHeatmap {
  user_id: string;
  username: string;
  start_date: string;
  end_date: string;
  /** Every day in the window, ascending, gaps included as `count: 0`. */
  days: HeatmapDay[];
  streak: StreakSummary;
  breakdown: ActivityTypeCount[];
}

export interface HeatmapQuery {
  /** 1-366. Defaults to 365 server-side. */
  days?: number;
  /** Comma-separated ActivityType values; omit for everything. */
  activity_types?: string;
}

export const activityHeatmapApi = {
  getForUser: (username: string, query?: HeatmapQuery) =>
    api.get<ActivityHeatmap>(`/api/v1/users/${encodeURIComponent(username)}/activity-heatmap`, {
      query: query as Record<string, string | number | undefined>,
    }),

  getMine: (query?: HeatmapQuery) =>
    api.get<ActivityHeatmap>("/api/v1/users/me/activity-heatmap", {
      auth: true,
      query: query as Record<string, string | number | undefined>,
    }),
};
