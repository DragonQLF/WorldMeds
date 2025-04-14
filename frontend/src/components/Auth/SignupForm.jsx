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

const Footer = styled.div`
  text-align: center;
  font-size: 0.9rem;
`;

const SignupForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // mock sign up
    if (formData.password === formData.confirmPassword) {
      onSwitchToLogin();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign up</h2>
      <FormContainer>
        <Input name="firstName" placeholder="First Name" onChange={handleChange} required />
        <Input name="lastName" placeholder="Last Name" onChange={handleChange} required />
        <Input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <Input name="phone" placeholder="Phone Number" onChange={handleChange} />
        <Input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <Input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />
        <label>
          <input type="checkbox" required /> I agree to the Terms and Privacy Policy
        </label>
        <Button type="submit">Create account</Button>
      </FormContainer>
      <Footer>
        Already have an account?{' '}
        <span style={{ color: '#4f46e5', cursor: 'pointer' }} onClick={onSwitchToLogin}>
          Login
        </span>
      </Footer>
    </form>
  );
};

export default SignupForm;
