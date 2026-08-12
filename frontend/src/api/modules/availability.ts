import { apiClient } from "../client";
import { UserAvailability, AvailabilityUpdate } from "../../types/availability";

export const availabilityApi = {
  getMyAvailability: async (): Promise<UserAvailability> => {
    const { data } = await apiClient.get("/api/availability/me");
    return data;
  },

  updateMyAvailability: async (updateData: AvailabilityUpdate): Promise<UserAvailability> => {
    const { data } = await apiClient.put("/api/availability/me", updateData);
    return data;
  },

  getUserAvailability: async (username: string): Promise<UserAvailability> => {
    const { data } = await apiClient.get(`/api/availability/${username}`);
    return data;
  }
};
