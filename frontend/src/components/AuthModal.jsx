// AuthModal.jsx
import React, { useEffect } from 'react';
import styled from 'styled-components';
import LoginForm from './Auth/LoginForm';
import SignupForm from './Auth/SignupForm';
import ForgotPasswordForm from './Auth/ForgotPasswordForm';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
`;

const AuthModal = ({ activePage, setActivePage, onClose, onLoginSuccess }) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === 'overlay') onClose();
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <Overlay id="overlay">
      <ModalContent>
        {activePage === 'login' && (
          <LoginForm
            onSwitchToSignup={() => setActivePage('signup')}
            onSwitchToForgot={() => setActivePage('forgot')}
            onLoginSuccess={onLoginSuccess}
          />
        )}
        {activePage === 'signup' && (
          <SignupForm onSwitchToLogin={() => setActivePage('login')} />
        )}
        {activePage === 'forgot' && (
          <ForgotPasswordForm onSwitchToLogin={() => setActivePage('login')} />
        )}
      </ModalContent>
    </Overlay>
  );
};

export default AuthModal;