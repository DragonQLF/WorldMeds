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

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string | File;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
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

  async updateProfile(data: ProfileUpdateData) {
    try {
      let formData;
      
      // If there's a file to upload, use FormData
      if (data.profilePicture instanceof File) {
        formData = new FormData();
        
        if (data.firstName) formData.append("firstName", data.firstName);
        if (data.lastName) formData.append("lastName", data.lastName);
        if (data.email) formData.append("email", data.email);
        formData.append("profilePicture", data.profilePicture);
        
        const response = await api.put("/profile", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
        
        if (response.data.success) {
          // Update user in localStorage
          const currentUser = this.getUser();
          const updatedUser = { ...currentUser, ...response.data.user };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        
        return response.data;
      } else {
        // Regular JSON request for text fields
        const response = await api.put("/profile", data);
        
        if (response.data.success) {
          // Update user in localStorage
          const currentUser = this.getUser();
          const updatedUser = { ...currentUser, ...response.data.user };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        
        return response.data;
      }
    } catch (error: any) {
      console.error("Profile update error:", error?.response?.data || error.message);
      return { 
        success: false, 
        message: error?.response?.data?.message || "Failed to connect to server" 
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

  async uploadProfilePicture(file: File) {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      
      // Add cache-busting parameter to prevent browser caching
      const cacheBuster = `?t=${Date.now()}`;
      
      const response = await api.post("/upload-profile-picture", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data.success) {
        // Update user in localStorage
        const currentUser = this.getUser();
        // Add cache-busting parameter to the URL to force image refresh
        const profilePictureWithCache = response.data.profilePicture.includes('?') 
          ? `${response.data.profilePicture}&t=${Date.now()}` 
          : `${response.data.profilePicture}${cacheBuster}`;
          
        const updatedUser = { 
          ...currentUser, 
          profilePicture: profilePictureWithCache
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error: any) {
      console.error("Profile picture upload error:", error?.response?.data || error.message);
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
