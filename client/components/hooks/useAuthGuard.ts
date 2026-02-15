"use client";

import { useEffect } from 'react';
import { apiClient } from '../../lib/api';

export function useAuthGuard() {
  useEffect(() => {
    apiClient.get('/api/auth/me').catch(() => {
      localStorage.removeItem('user');
      window.location.href = '/';
    });
  }, []);
}
