import axios from 'axios';
import type { User, Email, PaginatedResponse, SlackStatus } from '../types';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface ScheduleRequest {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayBetweenMs: number;
  hourlyLimit: number;
}

export const authApi = {
  getMe: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
  loginWithGoogle: () => {
    window.location.href = `${API_URL}/auth/google`;
  },
};

export const emailApi = {
  schedule: (data: ScheduleRequest) =>
    api.post<{ count: number }>('/api/emails/schedule', data),

  getScheduled: (page = 1) =>
    api.get<PaginatedResponse<Email>>('/api/emails/scheduled', { params: { page } }),

  getSent: (page = 1) =>
    api.get<PaginatedResponse<Email>>('/api/emails/sent', { params: { page } }),

  search: (query: string, page = 1) =>
    api.get<{ emails: Email[]; page: number }>('/api/emails/search', {
      params: { q: query, page },
    }),
};

export const slackApi = {
  connect: () => {
    window.location.href = `${API_URL}/api/slack/connect`;
  },
  getStatus: () => api.get<SlackStatus>('/api/slack/status'),
  disconnect: () => api.delete('/api/slack/disconnect'),
};