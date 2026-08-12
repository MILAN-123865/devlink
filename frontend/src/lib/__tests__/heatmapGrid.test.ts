import { describe, expect, it } from "vitest";
import { buildMonthLabels, buildWeeks } from "@/lib/heatmapGrid";
import type { HeatmapDay } from "@/api/modules/activityHeatmap";

function makeDays(
  startIso: string,
  count: number,
  countAt: Record<number, number> = {},
): HeatmapDay[] {
  const [y, m, d] = startIso.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(start + i * 86_400_000);
    const dayCount = countAt[i] ?? 0;
    return {
      day: date.toISOString().slice(0, 10),
      count: dayCount,
      level: (dayCount === 0 ? 0 : 2) as HeatmapDay["level"],
    };
  });
}

describe("buildWeeks", () => {
  it("returns nothing for an empty window", () => {
    expect(buildWeeks([])).toEqual([]);
  });

  it("pads the first column so weekday rows line up", () => {
    // 2026-06-17 is a Wednesday, so three blanks precede it.
    const weeks = buildWeeks(makeDays("2026-06-17", 5));
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null]);
    expect(weeks[0][3]?.day).toBe("2026-06-17");
  });

  it("does not pad when the window starts on a Sunday", () => {
    // 2026-06-14 is a Sunday.
    const weeks = buildWeeks(makeDays("2026-06-14", 7));
    expect(weeks[0][0]?.day).toBe("2026-06-14");
    expect(weeks).toHaveLength(1);
  });

  it("pads the trailing column to a full seven rows", () => {
    const weeks = buildWeeks(makeDays("2026-06-14", 9));
    expect(weeks).toHaveLength(2);
    expect(weeks[1]).toHaveLength(7);
    expect(weeks[1].slice(2)).toEqual([null, null, null, null, null]);
  });

  it("keeps every day exactly once", () => {
    const days = makeDays("2026-01-01", 365);
    const flat = buildWeeks(days)
      .flat()
      .filter((d): d is HeatmapDay => d !== null);
    expect(flat).toHaveLength(365);
    expect(new Set(flat.map((d) => d.day)).size).toBe(365);
  });

  it("every column has seven slots", () => {
    const weeks = buildWeeks(makeDays("2026-03-04", 100));
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});

describe("buildMonthLabels", () => {
  it("labels each month once", () => {
    const weeks = buildWeeks(makeDays("2026-01-01", 200));
    const labels = buildMonthLabels(weeks);
    const names = labels.map((l) => l.label);
    expect(new Set(names).size).toBe(names.length);
    expect(names[0]).toBe("Jan");
  });

  it("skips a label that would sit on top of the previous one", () => {
    // A three-week window straddling a month boundary must not emit two
    // labels a single column apart.
    const weeks = buildWeeks(makeDays("2026-01-25", 14));
    const labels = buildMonthLabels(weeks);
    for (let i = 1; i < labels.length; i += 1) {
      expect(labels[i].index - labels[i - 1].index).toBeGreaterThanOrEqual(2);
    }
  });

  it("returns nothing for an empty grid", () => {
    expect(buildMonthLabels([])).toEqual([]);
  });

  it("ignores fully padded columns", () => {
    const padded: (HeatmapDay | null)[][] = [[null, null, null, null, null, null, null]];
    expect(buildMonthLabels(padded)).toEqual([]);
  });
});
