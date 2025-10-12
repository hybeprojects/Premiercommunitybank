"use client";

"use client";

import React from 'react';

type Tx = {
  id: number | string;
  description?: string | null;
  direction: 'debit' | 'credit';
  status: 'Posted' | 'Pending' | 'Completed' | 'Failed' | string;
  amount: number | string;
};

export default function TransactionList({ items, isLoading, error, variant = 'personal' }: { items?: Tx[]; isLoading?: boolean; error?: string | null; variant?: 'personal'|'business'; }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse h-12 rounded-md bg-gray-200" />
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }
  if (!items || items.length === 0) {
    return <div className="text-sm text-gray-500">No transactions yet</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((t) => (
        <div key={t.id} className="flex items-center justify-between border rounded-md p-2">
          <div>
            <div className={variant === 'business' ? 'text-sm text-gray-200 md:text-gray-700' : 'text-sm text-gray-700'}>
              {t.description || 'Transfer'}
            </div>
            <div className={variant === 'business' ? 'text-xs text-gray-400 md:text-gray-500' : 'text-xs text-gray-500'}>
              {t.direction} • {t.status}
            </div>
          </div>
          <div className="font-medium">{t.direction === 'debit' ? '-' : '+'}${Number(t.amount).toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}
