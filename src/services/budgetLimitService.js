import { api } from "./apiClient";
import { USE_MOCK_API } from "../devConfig";

let mockLimitsByPeriod = {};

export async function fetchBudgetLimits(period) {
  if (!period) throw new Error("period is required to fetch budget limits");
  if (USE_MOCK_API) {
    return mockLimitsByPeriod[period] ?? { period, overall: null, categories: [] };
  }
  try {
    const response = await api.get(`/budget-limits?period=${period}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching budget limits:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch budget limits");
  }
}

export async function saveBudgetLimits(data) {
  if (!data?.period) throw new Error("period is required to save budget limits");
  if (USE_MOCK_API) {
    mockLimitsByPeriod = { ...mockLimitsByPeriod, [data.period]: data };
    return data;
  }
  try {
    const response = await api.put("/budget-limits", data);
    return response.data;
  } catch (error) {
    console.error("Error saving budget limits:", error);
    throw new Error(error.response?.data?.error || "Failed to save budget limits");
  }
}
