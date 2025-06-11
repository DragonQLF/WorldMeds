import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading..." 
}) => (
  <div className="flex items-center justify-center h-32">
    <p>{message}</p>
  </div>
); 