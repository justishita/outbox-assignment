import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-peacock-cyan border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
