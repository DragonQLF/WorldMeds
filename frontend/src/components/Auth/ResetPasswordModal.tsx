
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { auth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { useMapContext } from "@/contexts/MapContext";
import { Eye, EyeOff, Key } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
  token?: string;
}

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordModal({ 
  isOpen, 
  onOpenChange, 
  onLoginClick,
  token 
}: ResetPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { darkMode } = useMapContext();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid reset token",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await auth.resetPassword(token, data.newPassword);
      
      if (response.success) {
        toast({
          title: "Password reset successful",
          description: "Your password has been reset. You can now log in with your new password.",
        });
        form.reset();
        onOpenChange(false);
        onLoginClick();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to reset password",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoSrc = darkMode ? "/icone-dark.png" : "/icone.png";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src={logoSrc} alt="WorldMeds" className="h-16 w-auto" />
          </div>
          <DialogTitle className="text-2xl text-center font-bold worldmeds-font">Reset Password</DialogTitle>
          <DialogDescription className="text-center">
            Enter your new password
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pl-10 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="pl-10 pr-10"
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
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-4 text-center text-sm">
          Remember your password?{" "}
          <Button 
            variant="link" 
            className="p-0" 
            onClick={onLoginClick}
          >
            Sign in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
