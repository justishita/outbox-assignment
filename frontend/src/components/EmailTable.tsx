import React from 'react';
import { Badge } from './ui/Badge';
import { Table } from './ui/Table';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { Mail } from 'lucide-react';
import type { Email } from '../types';

interface EmailTableProps {
  emails: Email[];
  loading: boolean;
  error?: string;
}

export const EmailTable: React.FC<EmailTableProps> = ({ emails, loading, error }) => {
  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {error}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <EmptyState
        icon={<Mail className="w-12 h-12" />}
        title="No emails found"
        description="Start by scheduling your first email campaign"
      />
    );
  }

  return (
    <Table headers={['To', 'Subject', 'Scheduled Time', 'Status']}>
      {emails.map((email) => (
        <tr key={email.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface/50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {email.toEmail}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {email.subject}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {new Date(email.scheduledAt).toLocaleString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge status={email.status} />
          </td>
        </tr>
      ))}
    </Table>
  );
};
