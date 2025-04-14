import React, { useState } from 'react';
import styled from 'styled-components';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 100%;
`;

const Button = styled.button`
  background-color: #4f46e5;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
`;

const LinkText = styled.p`
  text-align: right;
  color: #6b7280;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    color: #4f46e5;
  }
`;

const Footer = styled.div`
  text-align: center;
  font-size: 0.9rem;
`;

const LoginForm = ({ onSwitchToSignup, onSwitchToForgot, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // mock login
    if (email && password) {
      onLoginSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <FormContainer>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <LinkText onClick={onSwitchToForgot}>Forgot Password?</LinkText>
        <Button type="submit">Login</Button>
      </FormContainer>
      <Footer>
        Don’t have an account?{' '}
        <span style={{ color: '#4f46e5', cursor: 'pointer' }} onClick={onSwitchToSignup}>
          Sign up
        </span>
      </Footer>
    </form>
  );
};

export default LoginForm;
