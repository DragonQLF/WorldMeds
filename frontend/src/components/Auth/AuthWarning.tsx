import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { ModalType } from './AuthModals';

interface AuthWarningProps {
  message?: string;
  onLoginClick: () => void;
}

export default function AuthWarning({ 
  message = "Some features may be limited without authentication.", 
  onLoginClick 
}: AuthWarningProps) {
  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Not authenticated</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onLoginClick}
          className="ml-2"
        >
          Log in
        </Button>
      </AlertDescription>
    </Alert>
  );
} 