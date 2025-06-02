
import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import ResetPasswordModal from './ResetPasswordModal';
import MobileLoginPage from './MobileLoginPage';
import { useIsMobile } from '@/hooks/use-mobile';

export type ModalType = 'login' | 'register' | 'forgotPassword' | 'resetPassword' | null;

interface AuthModalsProps {
  modalType: ModalType;
  onClose: () => void;
  resetToken?: string;
}

export default function AuthModals({ modalType, onClose, resetToken }: AuthModalsProps) {
  const isMobile = useIsMobile();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleOpenRegister = () => {
    onClose();
    setTimeout(() => {
      const event = new CustomEvent('open-auth-modal', { detail: { type: 'register' } });
      window.dispatchEvent(event);
    }, 150);
  };

  const handleOpenLogin = () => {
    onClose();
    setTimeout(() => {
      const event = new CustomEvent('open-auth-modal', { detail: { type: 'login' } });
      window.dispatchEvent(event);
    }, 150);
  };

  const handleOpenForgotPassword = () => {
    onClose();
    setTimeout(() => {
      const event = new CustomEvent('open-auth-modal', { detail: { type: 'forgotPassword' } });
      window.dispatchEvent(event);
    }, 150);
  };

  // On mobile, show full-page login instead of modal
  if (isMobile && modalType === 'login') {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <MobileLoginPage
          onBack={onClose}
          onRegisterClick={handleOpenRegister}
          onForgotPasswordClick={handleOpenForgotPassword}
        />
      </div>
    );
  }

  return (
    <>
      <LoginModal 
        isOpen={modalType === 'login' && !isMobile} 
        onOpenChange={handleOpenChange}
        onRegisterClick={handleOpenRegister}
        onForgotPasswordClick={handleOpenForgotPassword}
      />
      
      <RegisterModal 
        isOpen={modalType === 'register'} 
        onOpenChange={handleOpenChange}
        onLoginClick={handleOpenLogin}
      />
      
      <ForgotPasswordModal 
        isOpen={modalType === 'forgotPassword'} 
        onOpenChange={handleOpenChange}
        onLoginClick={handleOpenLogin}
      />

      <ResetPasswordModal 
        isOpen={modalType === 'resetPassword'} 
        onOpenChange={handleOpenChange}
        onLoginClick={handleOpenLogin}
        token={resetToken}
      />
    </>
  );
}
