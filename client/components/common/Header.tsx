"use client";

import React from 'react';
import Link from 'next/link';
import { useNotifications } from '../hooks/useNotifications';

export default function Header() {
  const { items } = useNotifications();
  const unread = items.filter(i => !i.read).length;

  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <a className="flex items-center gap-2 font-semibold text-lg">
              <span className="text-2xl">🏦</span>
              <span>Premierbank</span>
            </a>
          </Link>
          <div className="hidden sm:block text-sm text-gray-600">Secure Banking</div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand">
            🔔
            {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{unread}</span>}
          </button>
          <Link href="/dashboard/personal"><a className="button hidden sm:inline">Dashboard</a></Link>
          <div className="relative">
            <button className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand">
              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">{user && user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</span>
              <span className="hidden sm:block text-sm">{user ? user.fullName : 'Account'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
