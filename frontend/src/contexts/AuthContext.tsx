import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { connectWebSocket, disconnectWebSocket, startPingInterval, stopPingInterval } from "@/services/websocketService";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  role?: string;
}

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
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
  refreshUserData: () => Promise<void>;
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

  // Check for existing auth on mount and manage WebSocket connection
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
            
            if (profileResponse.data?.user) {
              // Set the user with verified data from the server
              const userData = {
                ...profileResponse.data.user,
                // Ensure admin status is correctly set
                isAdmin: profileResponse.data.user.role === 'admin',
              };
              
              console.log('User authenticated with profile data:', { 
                id: userData.id, 
                role: userData.role, 
                isAdmin: userData.isAdmin 
              });
              
              setUser(userData);
              
              // Connect to WebSocket for online status tracking
              connectWebSocket(token);
              startPingInterval();
            } else {
              // If no profile data, process the stored user
              const processedUser = {
                ...storedUser,
                // Ensure admin status is correctly set
                isAdmin: storedUser.role === 'admin'
              };
              
              console.log('Using stored user data:', { 
                id: processedUser.id, 
                role: processedUser.role, 
                isAdmin: processedUser.isAdmin 
              });
              
              setUser(processedUser);
              
              // Connect to WebSocket for online status tracking
              connectWebSocket(token);
              startPingInterval();
            }
          } catch (error) {
            console.error("Token validation failed:", error);
            // If the token is invalid, clear auth data
            auth.logout();
            disconnectWebSocket();
            stopPingInterval();
          }
        } else {
          console.log('No stored authentication found');
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Clear potentially corrupt auth data
        auth.logout();
        disconnectWebSocket();
        stopPingInterval();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Clean up WebSocket connection on unmount
    return () => {
      disconnectWebSocket();
      stopPingInterval();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await auth.login({ email, password });
      
      if (response.success) {
        setUser(response.user);
        
        // Connect to WebSocket after successful login
        const token = localStorage.getItem("auth_token");
        if (token) {
          connectWebSocket(token);
        }
        
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
      // Ensure we're using the correct field names for the backend
      const registerData = {
        firstName: data.firstName,
        lastName: data.lastName,
        first_name: data.firstName,  // Include both formats
        last_name: data.lastName,    // Include both formats
        email: data.email,
        password: data.password
      };
      
      const response = await auth.register(registerData);
      
      if (response.success) {
        setUser(response.user);
        
        // Connect to WebSocket after successful registration
        const token = localStorage.getItem("auth_token");
        if (token) {
          connectWebSocket(token);
        }
        
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

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        const profileResponse = await api.get("/profile");
        if (profileResponse.data?.user) {
          const userData = {
            ...profileResponse.data.user,
            isAdmin: profileResponse.data.user.role === 'admin',
          };
          setUser(userData);
        }
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const logout = () => {
    // Disconnect WebSocket before logout
    disconnectWebSocket();
    stopPingInterval();
    
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
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
