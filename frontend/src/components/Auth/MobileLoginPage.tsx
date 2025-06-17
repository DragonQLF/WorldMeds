import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, Key, Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useMapContext } from "@/contexts/MapContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { GoogleLogin } from '@react-oauth/google';

interface MobileLoginPageProps {
  onBack: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function MobileLoginPage({ 
  onBack,
  onRegisterClick, 
  onForgotPasswordClick 
}: MobileLoginPageProps) {
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

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    
    try {
      const result = await login(data.email, data.password);
      
      if (result) {
        onBack();
        form.reset();
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An unexpected error occurred. Please try again later.");
    }
  };

  const logoSrc = darkMode ? "/icone-dark.png" : "/icone.png";

  return (
    <div className="fixed inset-0 min-h-screen bg-background dark:bg-gray-900 flex flex-col z-[9999]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="text-foreground dark:text-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground dark:text-gray-100">Sign In</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="max-w-sm mx-auto w-full space-y-6">
          {/* Logo */}
          <div className="text-center">
            <img src={logoSrc} alt="WorldMeds" className="h-20 w-auto mx-auto mb-4" />
            <h2 className="text-2xl font-bold worldmeds-font text-foreground dark:text-gray-100">
              Welcome back
            </h2>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error message */}
          {loginError && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{loginError}</p>
            </div>
          )}

          {/* Login Form */}
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
                            "text-foreground dark:text-gray-100 h-12"
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
                            "pl-10 pr-10 bg-background dark:bg-gray-800",
                            "border-input dark:border-gray-700",
                            "text-foreground dark:text-gray-100 h-12"
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

              <div className="flex items-center my-6 w-full">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="mx-3 text-muted-foreground text-xs">or</span>
                <div className="flex-grow border-t border-gray-700"></div>
              </div>
              <div className="flex flex-col items-center w-full mb-2">
                <GoogleLogin 
                  theme={darkMode ? "filled_black" : "outline"}
                  width={340}
                  text="continue_with"
                  shape="pill"
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      try {
                        const response = await fetch('/api/google', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ credential: credentialResponse.credential }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          localStorage.setItem('auth_token', data.token);
                          localStorage.setItem('user', JSON.stringify(data.user));
                          window.location.reload();
                        } else {
                          setLoginError(data.message || 'Google login failed');
                        }
                      } catch (error) {
                        setLoginError('Google login failed');
                      }
                    }
                  }}
                  onError={() => setLoginError('Google login failed')}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground dark:text-gray-300">
              Don't have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 text-primary dark:text-blue-400" 
                onClick={onRegisterClick}
              >
                Create an account
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
