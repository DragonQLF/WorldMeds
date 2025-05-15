
import React, { useState, useRef, useEffect } from "react";
import { XIcon, Moon, Sun, LogIn, User, LogOut, KeyRound, Eye, EyeOff } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { SidebarLogo } from "./SidebarLogo";
import { useMapContext } from "@/contexts/MapContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { navigationItems } = useSidebar();
  const { darkMode, toggleDarkMode } = useMapContext();
  const { isAuthenticated, user, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form values when user changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

  const handleLoginClick = () => {
    // Dispatch event to open login modal
    const event = new CustomEvent('open-auth-modal', { 
      detail: { type: 'login' } 
    });
    window.dispatchEvent(event);
    onClose();
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "U";
    
    const firstInitial = user.firstName?.[0] || "";
    const lastInitial = user.lastName?.[0] || "";
    
    return firstInitial + lastInitial || user.email[0].toUpperCase();
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    
    try {
      const success = await updateProfile(data);
      
      if (success) {
        // Form will be automatically updated via the useEffect when user changes
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    
    try {
      const success = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      if (success) {
        passwordForm.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="h-full max-w-[85%] w-[300px] bg-background border-r border-border shadow-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <SidebarLogo isExpanded={true} />
          <button onClick={onClose} className="text-gray-500 dark:text-gray-300">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
      
        <nav className="space-y-6 flex-1">
          <ul className="space-y-2">
            {navigationItems.map((item, index) => (
              <li key={index}>
                <button
                  className="flex items-center gap-3 p-3 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-left"
                  onClick={() => {
                    navigate(item.href);
                    onClose();
                  }}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto space-y-4">
          {isAuthenticated ? (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-gray-500 dark:text-gray-400">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="dark:text-gray-300">{user?.firstName || "Profile"}</span>
                </button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="bg-background border-r border-border shadow-lg backdrop-filter backdrop-blur-none text-foreground w-full max-w-md overflow-y-auto"
                onCloseAutoFocus={e => {
                  // When sheet closes, make sure we close the mobile menu too
                  onClose();
                  // Prevent focus returning to trigger which can cause unwanted side effects
                  e.preventDefault();
                }}
              >
                <SheetHeader className="mb-6">
                  <SheetTitle>Your Account</SheetTitle>
                  <SheetDescription>
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : "Your Profile"}
                  </SheetDescription>
                </SheetHeader>
                
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="space-y-6">
                    <div className="flex flex-col items-center justify-center mb-6">
                      <Avatar className="h-24 w-24 mb-2">
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="First name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Last name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="email@example.com" type="email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                              {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="password" className="space-y-6">
                    <Card>
                      <CardContent className="pt-6">
                        <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        type={showCurrentPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        autoComplete="current-password"
                                        {...field} 
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                      >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        type={showNewPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        autoComplete="new-password"
                                        {...field} 
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                      >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        autoComplete="new-password"
                                        {...field} 
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                      >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                              {isSubmitting ? "Changing Password..." : (
                                <>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Change Password
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      setIsSheetOpen(false);
                      logout();
                      onClose();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <button 
              className="flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-gray-500 dark:text-gray-300"
              onClick={handleLoginClick}
            >
              <LogIn className="w-6 h-6 text-gray-500 dark:text-gray-300" />
              <span className="dark:text-gray-300">Login</span>
            </button>
          )}

          <button 
            className="flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-gray-500 dark:text-gray-300"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <Sun className="w-6 h-6 text-gray-500 dark:text-gray-300" />
            ) : (
              <Moon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
            )}
            <span className="dark:text-gray-300">{darkMode ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
