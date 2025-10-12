"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, User, Settings, LogOut, Menu, X, CreditCard } from 'lucide-react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard/personal', icon: CreditCard },
  { name: 'Transactions', href: '/dashboard/personal/transactions', icon: CreditCard },
  { name: 'Transfers', href: '/dashboard/personal/transfers', icon: CreditCard },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/dashboard/personal" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              PremierBank
            </a>
          </div>

          <div className="hidden md:flex md:space-x-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
              <Bell size={22} />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <img className="h-8 w-8 rounded-full" src="/avatars/profile.png" alt="User" />
              </button>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5"
                >
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <User size={16} className="mr-2" /> Profile
                  </a>
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Settings size={16} className="mr-2" /> Settings
                  </a>
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <LogOut size={16} className="mr-2" /> Logout
                  </a>
                </motion.div>
              )}
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="md:hidden"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-900 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}