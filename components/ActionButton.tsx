
import React from 'react';
import { LoadingSpinner } from './Icons';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ children, isLoading, ...props }) => {
  return (
    <button
      className="w-full flex items-center justify-center p-3 bg-accent text-primary text-base font-bold rounded-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      {...props}
    >
      {isLoading ? <LoadingSpinner /> : null}
      {children}
    </button>
  );
};
