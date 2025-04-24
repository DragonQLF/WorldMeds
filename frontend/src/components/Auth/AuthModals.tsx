import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';

export type ModalType = 'login' | 'register' | 'forgotPassword' | null;

interface AuthModalsProps {
  modalType: ModalType;
  onClose: () => void;
}

export default function AuthModals({ modalType, onClose }: AuthModalsProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleOpenRegister = () => {
    onClose();
    setTimeout(() => {
      // We use setTimeout to avoid dialog animation conflicts
      const event = new CustomEvent('open-auth-modal', { detail: { type: 'register' } });
      window.dispatchEvent(event);
    }, 100);
  };

  const handleOpenLogin = () => {
    onClose();
    setTimeout(() => {
      const event = new CustomEvent('open-auth-modal', { detail: { type: 'login' } });
      window.dispatchEvent(event);
    }, 100);
  };

  const handleOpenForgotPassword = () => {
    onClose();
    setTimeout(() => {
      const event = new CustomEvent('open-auth-modal', { detail: { type: 'forgotPassword' } });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <>
      <LoginModal 
        isOpen={modalType === 'login'} 
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
    </>
  );
} 