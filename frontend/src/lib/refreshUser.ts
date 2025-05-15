
import { api } from "@/lib/api";

// This utility function can be used to refresh user data in components
// without having to modify the AuthContext directly
export const refreshUserData = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("No auth token found");
    }

    // Trigger a refresh of user data by calling the appropriate API endpoint
    // This will update the server-side session data
    const response = await api.get("/user/profile");
    
    // Dispatch a custom event that other components can listen for
    window.dispatchEvent(new CustomEvent("user-data-refreshed", { 
      detail: response.data 
    }));
    
    return response.data;
  } catch (error) {
    console.error("Error refreshing user data:", error);
    throw error;
  }
};
