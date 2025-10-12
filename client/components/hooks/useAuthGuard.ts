"use client";

import { useEffect } from 'react';

export function useAuthGuard() {
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) window.location.href = '/';
  }, []);
}
