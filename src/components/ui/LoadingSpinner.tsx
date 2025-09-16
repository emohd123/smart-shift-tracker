import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16',
    xl: 'h-32 w-32'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-gray-900 ${sizeClasses[size]} ${className}`} />
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;