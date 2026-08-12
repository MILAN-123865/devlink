import { api } from "../client";

/** Server-enforced cap; echoed back on every list response as `max_pins`. */
export const MAX_PINNED_PROJECTS = 6;

/** The slice of a project a profile card needs — not the full project. */
export interface PinnedProjectSummary {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  stage: string | null;
  tech_stack: string | null;
  tags: string[] | null;
  logo_url: string | null;
  banner_url: string | null;
  stars: number;
  views: number;
}

export interface PinnedProject {
  id: string;
  user_id: string;
  project_id: string;
  /** 0-based and contiguous — the server compacts after every removal. */
  position: number;
  project: PinnedProjectSummary | null;
  created_at: string;
}

export interface PinnedProjectList {
  items: PinnedProject[];
  total: number;
  max_pins: number;
}

export const pinnedProjectsApi = {
  getForUser: (username: string) =>
    api.get<PinnedProjectList>(`/api/v1/users/${encodeURIComponent(username)}/pinned-projects`),

  getMine: () => api.get<PinnedProjectList>("/api/v1/users/me/pinned-projects", { auth: true }),

  /** Appends after any existing pins. 409 if already pinned, 400 at the cap. */
  pin: (projectId: string) =>
    api.post<PinnedProject>(
      "/api/v1/users/me/pinned-projects",
      { project_id: projectId },
      { auth: true },
    ),

  /**
   * Replaces the whole pinned set in the given order — what drag-and-drop
   * wants. The server validates the batch before writing, so a rejected
   * request leaves the previous order intact.
   */
  replace: (projectIds: string[]) =>
    api.put<PinnedProjectList>(
      "/api/v1/users/me/pinned-projects",
      { project_ids: projectIds },
      { auth: true },
    ),

  unpin: (projectId: string) =>
    api.delete<void>(`/api/v1/users/me/pinned-projects/${encodeURIComponent(projectId)}`, {
      auth: true,
    }),
};
