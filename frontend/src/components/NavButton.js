import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  margin: 0.25rem 0;
  border: none;
  border-radius: 8px;
  background: #F3F4F6;
  color: #1F2937;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  ${(props) => props.active && `
    background: #4285f4;
    color: white;
  `}
`;

const NavButton = ({ active, onClick, children }) => {
  return (
    <Button active={active} onClick={onClick}>
      {children}
    </Button>
  );
};

export default NavButton;
