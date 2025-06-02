import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const [message, setMessage] = useState('');
  const [isVerificationInitiated, setIsVerificationInitiated] = useState(false);
  const [isMountedAndTokenChecked, setIsMountedAndTokenChecked] = useState(false);

  const verifyEmail = async (token: string) => {
    setStatus('loading');
    try {
      const response = await auth.verifyEmail(token);
      
      if (response.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        toast({
          title: "Email verified",
          description: "You can now log in to your account",
        });
      } else {
        setStatus('error');
        setMessage(response.message || 'Verification failed');
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: response.message || "Invalid or expired verification token",
        });
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification');
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  // Effect for initial token check on mount
  useEffect(() => {
    const token = searchParams.get('token');

    // If no token is present on mount, immediately set error state after a delay
    if (!token) {
      const timer = setTimeout(() => {
        setStatus('error');
        setMessage('Invalid verification link');
        setIsMountedAndTokenChecked(true);
      }, 500); // Delay to make initial state briefly visible
      return () => clearTimeout(timer); // Cleanup the timer
    } else {
        // If token is present, mark check as complete immediately
        setIsMountedAndTokenChecked(true);
    }

  }, [searchParams]); // Depend only on searchParams for the initial check


  // Effect for initiating verification after user click and initial check is done
  useEffect(() => {
    const token = searchParams.get('token');

    // Only proceed if initial check is done, verification is initiated by user, and token exists
    if (isMountedAndTokenChecked && isVerificationInitiated && token) {
        verifyEmail(token);
    } else if (isMountedAndTokenChecked && isVerificationInitiated && !token) {
         setStatus('error');
         setMessage('Invalid verification link');
    }

  }, [isMountedAndTokenChecked, isVerificationInitiated, searchParams]); // Depend on these states to trigger verification


  const handleGoToLogin = () => {
    navigate('/', { state: { openLogin: true } });
  };

  const handleInitiateVerification = () => {
      const token = searchParams.get('token');
      if (status === 'initial' && token) {
          setIsVerificationInitiated(true);
      } else if (!token) {
      } else if (status !== 'initial') {
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            {status === 'initial' && !isMountedAndTokenChecked && <Loader2 className="h-16 w-16 animate-spin text-gray-400" />}
            {status === 'initial' && isMountedAndTokenChecked && searchParams.get('token') && <Loader2 className="h-16 w-16 text-gray-500" />}
            {status === 'initial' && isMountedAndTokenChecked && !searchParams.get('token') && <XCircle className="h-16 w-16 text-red-500" />}
            {status === 'loading' && <Loader2 className="h-16 w-16 animate-spin text-blue-500" />}
            {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
            {status === 'error' && <XCircle className="h-16 w-16 text-red-500" />}
          </div>
          <CardTitle className="text-3xl font-bold">
            {status === 'initial' && isMountedAndTokenChecked && searchParams.get('token') && 'Verify Your Email'}
            {status === 'initial' && !isMountedAndTokenChecked && 'Loading...'}
            {status === 'initial' && isMountedAndTokenChecked && !searchParams.get('token') && 'Invalid Link'}
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="mt-2 text-base">
            {status === 'initial' && isMountedAndTokenChecked && searchParams.get('token') && 'Click the button below to verify your email address.'}
            {status === 'initial' && !isMountedAndTokenChecked && 'Checking verification link...'}
            {status === 'initial' && isMountedAndTokenChecked && !searchParams.get('token') && 'The verification link is invalid or expired.'}
            {(status === 'loading' || status === 'success') && message}
            {status === 'error' && message !== 'Invalid verification link' && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-4">
          {status === 'initial' && isMountedAndTokenChecked && searchParams.get('token') && (
            <Button onClick={handleInitiateVerification} className="w-full text-lg py-6">
              Verify Email
            </Button>
          )}
          {status === 'initial' && !isMountedAndTokenChecked && (
            <div>
            </div>
          )}
          {(status === 'success' || status === 'error') && isMountedAndTokenChecked && (
            <div className="space-y-4">
              <Button onClick={handleGoToLogin} className="w-full text-lg py-6">
                Go to Login
              </Button>
              {status === 'error' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try logging in or request a new verification email
                </p>
              )}
            </div>
          )}
          {status === 'error' && message === 'Invalid verification link' && isMountedAndTokenChecked && (
            <div className="space-y-4">
              <Button onClick={handleGoToLogin} className="w-full text-lg py-6">
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
