import React from 'react';

interface BadgeProps {
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles = {
    SCHEDULED: 'bg-blue-100 text-peacock-blue dark:bg-peacock-blue/20 dark:text-peacock-cyan',
    PROCESSING: 'bg-cyan-100 text-peacock-cyan dark:bg-peacock-cyan/20 dark:text-peacock-cyan',
    SENT: 'bg-teal-100 text-peacock-teal dark:bg-peacock-teal/20 dark:text-peacock-teal',
    FAILED: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
};
