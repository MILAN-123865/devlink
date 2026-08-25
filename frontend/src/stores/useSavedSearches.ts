import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import type { projectSearchSchema } from "@/routes/_app.projects";

export type SearchType = "Developers" | "Projects" | "Organizations" | "Hackathons";

export interface SavedSearchBase {
  id: string;
  name: string;
  type: SearchType;
  createdAt: string;
}

export interface SavedSearchDevelopers extends SavedSearchBase {
  type: "Developers";
  query: string;
  tab?: string;
}

export interface SavedSearchProjects extends SavedSearchBase {
  type: "Projects";
  filters: z.infer<typeof projectSearchSchema>;
}

export interface SavedSearchOrganizations extends SavedSearchBase {
  type: "Organizations";
  query: string;
}

export interface SavedSearchHackathons extends SavedSearchBase {
  type: "Hackathons";
  query: string;
}

export type SavedSearch =
  | SavedSearchDevelopers
  | SavedSearchProjects
  | SavedSearchOrganizations
  | SavedSearchHackathons;

interface SavedSearchesState {
  searches: SavedSearch[];
  saveSearch: (search: Omit<SavedSearch, "id" | "createdAt">) => void;
  deleteSearch: (id: string) => void;
  getSearchesByType: (type: SearchType) => SavedSearch[];
}

export const useSavedSearches = create<SavedSearchesState>()(
  persist(
    (set, get) => ({
      searches: [],
      saveSearch: (searchPayload) => {
        const newSearch: SavedSearch = {
          ...searchPayload,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        } as SavedSearch;
        set((state) => ({ searches: [...state.searches, newSearch] }));
      },
      deleteSearch: (id) =>
        set((state) => ({
          searches: state.searches.filter((s) => s.id !== id),
        })),
      getSearchesByType: (type) => get().searches.filter((s) => s.type === type),
    }),
    {
      name: "devlink:saved-searches",
    },
  ),
);
