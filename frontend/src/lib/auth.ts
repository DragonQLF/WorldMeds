
import { api } from "./api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const auth = {
  async login({ email, password }: LoginCredentials) {
    try {
      const response = await api.post("/login", { email, password });
      if (response.data.success) {
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      console.error("Login error:", error?.response?.data || error.message);
      return { 
        success: false, 
        message: error?.response?.data?.message || "Failed to connect to server" 
      };
    }
  },

  async register(data: RegisterCredentials) {
    try {
      // Only send the exact required fields
      const requestData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password
      };
      
      console.log("Sending registration data to backend:", requestData);
      const response = await api.post("/signup", requestData);
      console.log("Registration response from backend:", response.data);
      
      if (response.data.success) {
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      console.error("Registration error:", error?.response?.data || error.message);
      return { 
        success: false, 
        message: error?.response?.data?.message || "Failed to connect to server" 
      };
    }
  },

  async updateProfile(data: ProfileUpdateData) {
    try {
      // Convert camelCase to snake_case for backend compatibility
      const requestData = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email
      };
      
      const response = await api.put("/profile", requestData);
      return response.data;
    } catch (error: any) {
      console.error("Profile update error:", error?.response?.data || error.message);
      return {
        success: false,
        message: error?.response?.data?.message || "Failed to update profile"
      };
    }
  },

  async changePassword(data: PasswordChangeData) {
    try {
      const response = await api.put("/change-password", data);
      return response.data;
    } catch (error: any) {
      console.error("Password change error:", error?.response?.data || error.message);
      return { 
        success: false, 
        message: error?.response?.data?.message || "Failed to connect to server" 
      };
    }
  },

  async forgotPassword(email: string) {
    try {
      const response = await api.post("/forgot-password", { email });
      return response.data;
    } catch (error: any) {
      console.error("Forgot password error:", error?.response?.data || error.message);
      return { 
        success: false, 
        message: error?.response?.data?.message || "Failed to connect to server" 
      };
    }
  },

  logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    window.location.href = "/";
  },

  isAuthenticated() {
    return !!localStorage.getItem("auth_token");
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
};
