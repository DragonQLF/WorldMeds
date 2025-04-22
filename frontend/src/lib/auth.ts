
import { api } from "./api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
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
      const response = await api.post("/signup", data);
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
    window.location.href = "/auth/login";
  },

  isAuthenticated() {
    return !!localStorage.getItem("auth_token");
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
};
