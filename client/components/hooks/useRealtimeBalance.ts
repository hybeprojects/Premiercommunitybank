"use client";

import { useEffect, useState } from 'react';
import { getSocket } from '../../lib/socket';

export function useRealtimeBalance(initial = 0) {
  const [balance, setBalance] = useState<number>(initial);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const onUpdate = (payload: any) => {
      if (!payload) return;
      if (typeof payload.balance === 'number') setBalance(payload.balance);
      else if (typeof payload.delta === 'number') setBalance((b) => b + payload.delta);
    };

    s.on('balance_update', onUpdate);
    return () => {
      s.off('balance_update', onUpdate);
    };
  }, []);

  return { balance, setBalance };
}
