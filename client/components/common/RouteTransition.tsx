"use client";

import React, { useEffect, useState } from 'react';
import { useNavigation } from 'next/navigation';

export default function RouteTransition() {
  const navigation = useNavigation();
  const loading = navigation.state === 'loading';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t: number | undefined;
    if (loading) {
      // show immediately
      setVisible(true);
    } else {
      // keep visible for a short exit animation
      t = window.setTimeout(() => setVisible(false), 300);
    }
    return () => { if (t) window.clearTimeout(t); };
  }, [loading]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col items-center gap-4 bg-white/90 dark:bg-black/75 rounded-xl p-6 shadow-lg transform transition-transform duration-300 ${loading ? 'translate-y-0' : 'translate-y-4'}">
        <div className="w-12 h-12 rounded-full border-4 border-t-brand border-gray-200 animate-spin" />
        <div className="text-sm font-medium">Redirecting...</div>
      </div>
    </div>
  );
}
