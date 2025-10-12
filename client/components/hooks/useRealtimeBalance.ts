"use client";

import { useEffect, useState } from 'react';
import { getSocket } from '../../lib/socket';

export function useRealtimeBalance(initial = 0) {
  const [balance, setBalance] = useState<number>(initial);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    // try to join room for user if we have user info
    try {
      const raw = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      const user = raw ? JSON.parse(raw) : null;
      if (user && user.userId) s.emit('authenticate', { userId: user.userId, token });
    } catch (e) {}

    const onUpdate = (payload: any) => {
      if (!payload) return;
      if (typeof payload.balance === 'number') setBalance(payload.balance);
      else if (typeof payload.delta === 'number') setBalance(b => b + payload.delta);
    };

    s.on('balance_update', onUpdate);
    return () => { s.off('balance_update', onUpdate); };
  }, []);

  return { balance, setBalance };
}
