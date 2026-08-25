import { api } from "../client";
import type { Flare } from "@/mocks/seed";
import { analyzeSpam } from "@/lib/validation/spamDetection";

export const postsApi = {
  list: (query?: { page?: number; limit?: number }) => api.get<Flare[]>("/api/posts", { query }),
 feat/organization-roles-987-v2
  drafts: () => api.get<Flare[]>("/api/posts/drafts"),
  create: async (body: {
    content: string;
    image?: string;
    tags?: string[];
    status?: string;
    publish_at?: string;
  }) => {

  drafts: (query?: { page?: number; limit?: number }) =>
    api.get<Flare[]>("/api/posts/drafts", { query }),
  create: async (body: { content: string; image?: string; tags?: string[] }) => {
 main
    const spamCheck = analyzeSpam(body.content);
    if (spamCheck.isSpam) {
      throw new Error(`Post rejected by AI Spam Filter: ${spamCheck.reasons.join(". ")}`);
    }
    return api.post<Flare>("/api/posts", body);
  },
 feat/organization-roles-987-v2
  update: (id: string, body: Partial<Flare & { status?: string; publish_at?: string }>) =>
    api.put<Flare>(`/api/posts/${id}`, body),

  update: (id: string, body: Partial<Flare>) => api.put<Flare>(`/api/posts/${id}`, body),
 main
  remove: (id: string) => api.delete<void>(`/api/posts/${id}`),
  like: (id: string) => api.post<{ likes: number }>(`/api/posts/${id}/like`),
  unlike: (id: string) => api.delete<{ likes: number }>(`/api/posts/${id}/like`),
  comment: async (id: string, comment: string) => {
    const spamCheck = analyzeSpam(comment);
    if (spamCheck.isSpam) {
      throw new Error(`Comment rejected by AI Spam Filter: ${spamCheck.reasons.join(". ")}`);
    }
    return api.post<unknown>(`/api/posts/${id}/comment`, { comment });
  },
};
