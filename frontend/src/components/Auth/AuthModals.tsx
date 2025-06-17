import React from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import ResetPasswordModal from './ResetPasswordModal';
import MobileLoginPage from './MobileLoginPage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

export type ModalType = 'login' | 'register' | 'forgotPassword' | 'resetPassword' | null;

interface AuthModalsProps {
  modalType: ModalType;
  onClose: () => void;
  resetToken?: string;
}

const AuthModals: React.FC<AuthModalsProps> = ({ modalType, onClose, resetToken }) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();

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

  if (isMobile) {
    return <MobileLoginPage />;
  }

  return (
    <div>
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

      <ResetPasswordModal 
        isOpen={modalType === 'resetPassword'} 
        onOpenChange={handleOpenChange}
        onLoginClick={handleOpenLogin}
        token={resetToken}
      />
    </div>
  );
}

export default AuthModals;
