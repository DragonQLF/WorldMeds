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
  color: #4f46e5;
  cursor: pointer;
  font-size: 0.9rem;
`;

const ForgotPasswordForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Password reset link sent to ${email}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Forgot your password?</h2>
      <p>Don't worry, happens to all of us. Enter your email below to recover your password.</p>
      <FormContainer>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit">Submit</Button>
        <LinkText onClick={onSwitchToLogin}>← Back to login</LinkText>
      </FormContainer>
    </form>
  );
};

export default ForgotPasswordForm;
//aa