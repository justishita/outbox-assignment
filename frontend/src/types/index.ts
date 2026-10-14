export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Email {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string;
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';
  error?: string;
  etherealPreviewUrl?: string;
  sender: {
    id: string;
    etherealUser: string;
  };
}

export interface PaginatedResponse<T> {
  emails: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SlackStatus {
  connected: boolean;
  teamName?: string;
}
