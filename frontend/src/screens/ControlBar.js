import React from 'react';
import styled from 'styled-components';

const ControlBarContainer = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  gap: 1rem;
  z-index: 1000;

  @media (max-width: 768px) {
    flex-direction: column;
    position: relative;
    top: auto;
    right: auto;
  }
`;

const IconButton = styled.button`
  background: #F3F4F6;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #1F2937;

  &:hover {
    opacity: 0.9;
  }
`;

const ControlBar = () => {
  return (
    <ControlBarContainer>
      <IconButton>
        <span>🔍</span>
        Search Country
      </IconButton>
      <IconButton>
        <span>💊</span>
        Search Medicine
      </IconButton>
    </ControlBarContainer>
  );
};

export default ControlBar;
