import type { HeatmapDay } from "@/api/modules/activityHeatmap";

/**
 * Pure layout helpers for the contribution grid.
 *
 * These live outside the component so the grid maths can be tested on its own,
 * and so the component file exports components only.
 */

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Parse the API's `YYYY-MM-DD` as a UTC date, not the viewer's local midnight. */
export function parseUtcDay(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Slice the flat day list into calendar weeks (columns), each starting on
 * Sunday. The first column is padded with nulls so weekday rows line up, and
 * the last is padded so every column is seven cells tall.
 */
export function buildWeeks(days: HeatmapDay[]): (HeatmapDay | null)[][] {
  if (days.length === 0) return [];

  const weeks: (HeatmapDay | null)[][] = [];
  let current: (HeatmapDay | null)[] = [];

  const leadingBlanks = parseUtcDay(days[0].day).getUTCDay();
  for (let i = 0; i < leadingBlanks; i += 1) current.push(null);

  for (const day of days) {
    current.push(day);
    if (current.length === 7) {
      weeks.push(current);
      current = [];
    }
  }

  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    weeks.push(current);
  }

  return weeks;
}

/**
 * A month label sits above the first column in which that month appears, and
 * only when it is at least two columns clear of the previous label — otherwise
 * a short window puts two labels side by side and they overlap into a smear.
 */
export function buildMonthLabels(
  weeks: (HeatmapDay | null)[][],
): { index: number; label: string }[] {
  const labels: { index: number; label: string }[] = [];
  let lastMonth = -1;
  let lastIndex = -2;

  weeks.forEach((week, index) => {
    const firstDay = week.find((d): d is HeatmapDay => d !== null);
    if (!firstDay) return;

    const month = parseUtcDay(firstDay.day).getUTCMonth();
    if (month !== lastMonth && index - lastIndex >= 2) {
      labels.push({ index, label: MONTH_LABELS[month] });
      lastMonth = month;
      lastIndex = index;
    }
  });

  return labels;
}

/** Human-readable summary of one cell, used for both `title` and `aria-label`. */
export function formatDayLabel(day: HeatmapDay): string {
  const pretty = parseUtcDay(day.day).toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (day.count === 0) return `No activity on ${pretty}`;
  return `${day.count} ${day.count === 1 ? "activity" : "activities"} on ${pretty}`;
}
