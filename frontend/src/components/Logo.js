import React from 'react';
import styled from 'styled-components';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 1rem;
`;

const LogoImage = styled.img`
  height: 40px;
  width: 40px;
`;

const Logo = () => {
  return (
    <LogoContainer>
      <LogoImage src="/logo.png" alt="WorldMeds Logo" />
      <h2>WorldMeds</h2>
    </LogoContainer>
  );
};

export default Logo;
