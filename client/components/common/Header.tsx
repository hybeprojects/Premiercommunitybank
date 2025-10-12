"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '../hooks/useNotifications';

export default function Header() {
  const { items } = useNotifications();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('user');
      setUser(userRaw ? JSON.parse(userRaw) : null);
    } catch (e) {
      setUser(null);
    }
  }, []);

  const unread = user ? items.filter(i => !i.read).length : 0;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="text-2xl">🏦</span>
            <span>Premierbank</span>
          </Link>
          <div className="hidden sm:block text-sm text-gray-600">Secure Banking</div>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand" aria-label="Notifications">
              🔔
              {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{unread}</span>}
            </button>
            <Link href="/dashboard/personal" className="button hidden sm:inline">Dashboard</Link>
            <div className="relative">
              <button className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand" aria-label="Account">
                <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">{user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</span>
                <span className="hidden sm:block text-sm">{user.fullName}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
