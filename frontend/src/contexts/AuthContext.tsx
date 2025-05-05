import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  isAdmin?: boolean;
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
  changePassword: (data: PasswordChangeData) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = auth.getUser();
        const token = localStorage.getItem("auth_token");
        
        if (storedUser && token) {
          // Verify token is still valid with the backend
          try {
            // Make a request to get the profile to verify the token
            const profileResponse = await api.get("/profile");
            
            // If the profile has a profile picture, check if it exists
            if (profileResponse.data?.user?.profilePicture) {
              // Set the user with verified data from the server
              setUser(profileResponse.data.user);
            } else {
              // If no profile picture, just set the user
              setUser(storedUser);
            }
          } catch (error) {
            // If the token is invalid, clear auth data
            console.error("Invalid token, clearing auth data");
            auth.logout();
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Clear potentially corrupt auth data
        auth.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await auth.login({ email, password });
      
      if (response.success) {
        setUser(response.user);
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });
        return true;
      } else {
        toast({
          variant: "destructive", 
          title: "Login failed",
          description: response.message || "Invalid credentials",
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An unexpected error occurred",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await auth.register(data);
      
      if (response.success) {
        setUser(response.user);
        toast({
          title: "Account created",
          description: "Your account has been successfully created",
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: response.message || "Could not create account",
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration error",
        description: "An unexpected error occurred",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: ProfileUpdateData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await auth.updateProfile(data);
      
      if (response.success) {
        // Update local user state with new information
        setUser(prevUser => prevUser ? { ...prevUser, ...response.user } : null);
        
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully",
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: response.message || "Could not update profile",
        });
        return false;
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error?.response?.data?.message === "Email already in use") {
        toast({
          variant: "destructive",
          title: "Email already in use",
          description: "This email address is already registered. Please use a different email.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update error",
          description: "An unexpected error occurred",
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: PasswordChangeData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await auth.changePassword(data);
      
      if (response.success) {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully",
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: response.message || "Could not update password",
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update error",
        description: "An unexpected error occurred",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      setIsLoading(true);
      const response = await auth.uploadProfilePicture(file);
      
      if (response.success) {
        // Update local user state with new profile picture
        setUser(prevUser => prevUser ? { 
          ...prevUser, 
          profilePicture: response.profilePicture 
        } : null);
        
        toast({
          title: "Photo uploaded",
          description: "Your profile photo has been updated",
        });
        return response.profilePicture;
      } else {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: response.message || "Could not upload profile picture",
        });
        return null;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload error",
        description: "An unexpected error occurred",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
        changePassword,
        uploadProfilePicture,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
