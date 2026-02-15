"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDown, ArrowUp, AlertCircle, Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

type Tx = {
  id: number | string;
  description?: string | null;
  direction: 'debit' | 'credit';
  status: 'Posted' | 'Pending' | 'Completed' | 'Failed' | string;
  amount: number | string;
  date: string;
};

function TransactionIcon({ direction }) {
  const className = direction === 'credit' ? "text-green-500" : "text-red-500";
  const Icon = direction === 'credit' ? ArrowDown : ArrowUp;
  return (
    <div className={cn("p-2 rounded-full", direction === 'credit' ? 'bg-green-100' : 'bg-red-100')}>
      <Icon size={16} className={className} />
    </div>
  );
}

function StatusBadge({ status }) {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
  const statusClasses = {
    'Posted': "bg-green-100 text-green-800",
    'Completed': "bg-green-100 text-green-800",
    'Pending': "bg-yellow-100 text-yellow-800",
    'Failed': "bg-red-100 text-red-800",
  };
  return <span className={cn(baseClasses, statusClasses[status] || 'bg-gray-100 text-gray-800')}>{status}</span>;
}

export default function TransactionList({ items, isLoading, error }: { items?: Tx[]; isLoading?: boolean; error?: string | null; }) {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    return (items || [])
      .filter(t => {
        if (filter === 'All') return true;
        if (filter === 'Income') return t.direction === 'credit';
        if (filter === 'Expense') return t.direction === 'debit';
        return true;
      })
      .filter(t => t.description?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, filter, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 rounded-lg">
        <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
        <p className="text-red-700 font-semibold">Failed to load transactions</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex space-x-2 mt-4">
          {['All', 'Income', 'Expense'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-full transition-colors",
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <AnimatePresence>
          {filteredItems.length > 0 ? (
            filteredItems.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <TransactionIcon direction={t.direction} />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{t.description || 'N/A'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date((t as any).created_at || t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", t.direction === 'credit' ? 'text-green-600' : 'text-red-600')}>
                    {t.direction === 'credit' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                  </p>
                  <StatusBadge status={t.status} />
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center p-8"
            >
              <Inbox className="text-gray-400 w-12 h-12 mb-4" />
              <p className="text-gray-500 font-semibold">No matching transactions</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}