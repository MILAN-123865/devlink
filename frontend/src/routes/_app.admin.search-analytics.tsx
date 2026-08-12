import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { TypoSection, TypoHeading } from "@/components/shared/Typography";

export const Route = createFileRoute("/_app/admin/search-analytics")({
  component: SearchAnalyticsDashboard,
});

interface KeywordCount {
  keyword: string;
  count: number;
}

interface SearchAnalyticsData {
  total_searches: number;
  zero_result_rate_pct: number;
  click_through_rate_pct: number;
  average_latency_ms: number;
  top_keywords?: KeywordCount[];
}

function SearchAnalyticsDashboard() {
  const [data, setData] = useState<SearchAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setData(await api.get<SearchAnalyticsData>("/api/search/analytics?days=30"));
      } catch (error) {
        console.error("Failed to fetch search analytics", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, []);

  if (loading) return <div className="p-6">Loading Analytics...</div>;
  if (!data) return <div className="p-6 text-red-500">Failed to load data.</div>;

  return (
    <div className="p-6">
      <TypoHeading as="h1">Platform Search Analytics (Last 30 Days)</TypoHeading>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow border">
          <TypoSection>Total Searches</TypoSection>
          <p className="text-3xl font-bold mt-2">{data.total_searches}</p>
        </div>

        <div className="bg-white p-6 rounded shadow border">
          <TypoSection>Zero-Result Rate</TypoSection>
          <p className="text-3xl font-bold mt-2 text-rose-600">{data.zero_result_rate_pct}%</p>
        </div>

        <div className="bg-white p-6 rounded shadow border">
          <TypoSection>Click-Through Rate (CTR)</TypoSection>
          <p className="text-3xl font-bold mt-2 text-green-600">{data.click_through_rate_pct}%</p>
        </div>

        <div className="bg-white p-6 rounded shadow border">
          <TypoSection>Avg Latency</TypoSection>
          <p className="text-3xl font-bold mt-2 text-blue-600">{data.average_latency_ms} ms</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow border">
        <TypoHeading as="h2">Top 10 Searched Keywords</TypoHeading>
        {data.top_keywords?.length === 0 ? (
          <p className="text-gray-500">No keyword data available.</p>
        ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3">Rank</th>
                <th className="p-3">Keyword</th>
                <th className="p-3">Search Count</th>
              </tr>
            </thead>
            <tbody>
              {data.top_keywords?.map((item: KeywordCount, idx: number) => (
                <tr key={idx} className="border-b">
                  <td className="p-3 text-gray-500">#{idx + 1}</td>
                  <td className="p-3 font-medium">{item?.keyword}</td>
                  <td className="p-3">{item?.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
