import { useState, useMemo, useEffect } from "react";
import { TypoHeading } from "@/components/shared/Typography";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Bookmark } from "lucide-react";
import { useSavedSearches } from "@/stores/useSavedSearches";
import { SaveSearchDialog } from "@/components/shared/SaveSearchDialog";

export const Route = createFileRoute("/_app/organizations/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: OrganizationsListPage,
});

const mockOrgs = [
  {
    id: "devlink-org",
    name: "DevLink",
    description: "The developer portfolio & project collaboration network.",
    hiring: true,
    members_count: 12,
    projects_count: 5,
  },
];

function OrganizationsListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState(search.q || "");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const saveSearch = useSavedSearches((s) => s.saveSearch);

  useEffect(() => {
    if (search.q !== undefined) {
      setQ(search.q);
    }
  }, [search.q]);

  useEffect(() => {
    const handler = setTimeout(() => {
      navigate({
        search: (prev: any) => ({ ...prev, q: q || undefined }),
        replace: true,
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [q, navigate]);

  const filteredOrgs = useMemo(() => {
    const query = q.toLowerCase();
    return mockOrgs.filter(
      (org) =>
        org.name.toLowerCase().includes(query) || org.description.toLowerCase().includes(query),
    );
  }, [q]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <TypoHeading as="h1">Organizations</TypoHeading>
          <p className="text-gray-400 mt-1">
            Discover startups, open-source orgs, and teams building awesome products.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative min-w-0 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search organizations..."
            className="w-full rounded-md border border-gray-800 bg-gray-900/40 py-[7px] pl-9 pr-3 text-[13px] text-gray-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
        <button
          onClick={() => setSaveDialogOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-800 bg-gray-900/40 px-2.5 py-[7px] text-[12px] font-medium text-gray-400 transition-colors hover:text-gray-100 hover:border-gray-700"
        >
          <Bookmark size={13} />
          Save Search
        </button>
      </div>

      <SaveSearchDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={(name) => {
          saveSearch({
            name,
            type: "Organizations",
            query: q,
          } as any);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrgs.map((org) => (
          <Link
            key={org.id}
            to="/organizations/$orgId"
            params={{ orgId: org.id }}
            className="block p-6 rounded-xl border border-gray-800 bg-gray-900/40 hover:border-indigo-500/50 hover:bg-gray-800/40 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <TypoHeading as="h2">{org.name}</TypoHeading>
              {org.hiring && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Hiring
                </span>
              )}
            </div>
            <p className="text-gray-300 text-sm mb-4">{org.description}</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>{org.members_count} Members</span>
              <span>•</span>
              <span>{org.projects_count} Projects</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
