import { api } from "../client";

export interface DailyActivityPoint {
  date: string;
  activity_count: number;
  messages: number;
  tasks_completed: number;
}

export interface ProjectCollaborationMetricsResponse {
  project_id: number;
  active_members: number;
  total_team_size: number;
  avg_response_time_hours: number;
  messages_exchanged: number;
  tasks_completed: number;
  applications_received: number;
  collaboration_score: number;
  daily_activity: DailyActivityPoint[];
}

export const getProjectCollaborationMetrics = (
  projectId: number
): Promise<ProjectCollaborationMetricsResponse> =>
  api.get<ProjectCollaborationMetricsResponse>(`/projects/${projectId}/collaboration-metrics`);
