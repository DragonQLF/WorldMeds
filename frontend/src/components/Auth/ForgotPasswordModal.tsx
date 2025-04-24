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

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordModal({ 
  isOpen, 
  onOpenChange, 
  onLoginClick 
}: ForgotPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { darkMode } = useMapContext();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      const response = await auth.forgotPassword(data.email);
      
      if (response.success) {
        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions",
        });
        form.reset();
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to send reset email",
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
          <DialogTitle className="text-2xl text-center font-bold worldmeds-font">Forgot Password</DialogTitle>
          <DialogDescription className="text-center">
            Enter your email to reset your password
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Reset password"}
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