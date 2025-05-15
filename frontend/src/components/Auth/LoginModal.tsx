
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Key, Mail } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useMapContext } from "@/contexts/MapContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginModal({ 
  isOpen, 
  onOpenChange, 
  onRegisterClick, 
  onForgotPasswordClick 
}: LoginModalProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const { darkMode } = useMapContext();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Clear error when modal opens or closes
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
      setLoginError(null);
    }
  }, [isOpen, form]);

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null); // Clear any previous errors
    
    try {
      const result = await login(data.email, data.password);
      
      if (result) {
        // Login was successful, modal will be closed by the auth context
        onOpenChange(false);
        form.reset();
      }
      // The error handling is now done in the AuthContext
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An unexpected error occurred. Please try again later.");
    }
  };

  const logoSrc = darkMode ? "/icone-dark.png" : "/icone.png";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background dark:bg-gray-900 text-foreground dark:text-gray-100 border dark:border-gray-800">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src={logoSrc} alt="WorldMeds" className="h-16 w-auto" />
          </div>
          <DialogTitle className="text-2xl text-center font-bold worldmeds-font text-foreground dark:text-gray-100">Sign In</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground dark:text-gray-400">
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>
        
        {/* Display login error if any */}
        {loginError && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
            <p className="text-red-700 dark:text-red-400 text-sm">{loginError}</p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-gray-200">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400 h-4 w-4" />
                      <Input 
                        type="email" 
                        placeholder="name@example.com" 
                        className={cn(
                          "pl-10 bg-background dark:bg-gray-800",
                          "border-input dark:border-gray-700",
                          "text-foreground dark:text-gray-100"
                        )}
                        autoComplete="username" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-gray-200">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400 h-4 w-4" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={cn(
                          "pl-10 bg-background dark:bg-gray-800",
                          "border-input dark:border-gray-700",
                          "text-foreground dark:text-gray-100"
                        )}
                        autoComplete="current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="link" 
                className="px-0 text-sm text-primary dark:text-blue-400"
                onClick={onForgotPasswordClick}
              >
                Forgot password?
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-4 text-center text-sm dark:text-gray-300">
          Don't have an account?{" "}
          <Button 
            variant="link" 
            className="p-0 text-primary dark:text-blue-400" 
            onClick={onRegisterClick}
          >
            Create an account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
