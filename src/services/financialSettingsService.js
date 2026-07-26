import { api } from "./apiClient";
import { USE_MOCK_API } from "../devConfig";

let mockCurrency = "USD";

export async function fetchFinancialSettings() {
  if (USE_MOCK_API) return { currency: mockCurrency };
  try {
    const response = await api.get("/financial-settings");
    return response.data;
  } catch (error) {
    console.error("Error fetching financial settings:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch financial settings");
  }
}

export async function saveFinancialSettings(currency) {
  if (USE_MOCK_API) {
    mockCurrency = currency;
    return { currency };
  }
  try {
    const response = await api.put("/financial-settings", { currency });
    return response.data;
  } catch (error) {
    console.error("Error saving financial settings:", error);
    throw new Error(error.response?.data?.error || "Failed to save financial settings");
  }
}
