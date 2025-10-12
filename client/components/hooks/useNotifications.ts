"use client";

import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../../lib/socket';

export function useNotifications(initial: any[] = []) {
  const [items, setItems] = useState<any[]>(initial);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    try {
      const raw = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      const user = raw ? JSON.parse(raw) : null;
      if (user && user.userId) s.emit('authenticate', { userId: user.userId, token });
    } catch (e) {}

    const onNotification = (n: any) => {
      setItems(prev => [n, ...prev]);
    };

    s.on('notification', onNotification);
    return () => { s.off('notification', onNotification); };
  }, []);

  const markRead = useCallback((id: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  }, []);

  return { items, setItems, markRead };
}
