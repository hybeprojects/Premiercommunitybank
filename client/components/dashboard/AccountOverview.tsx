"use client";

import React from 'react';
import { useRealtimeBalance } from '../hooks/useRealtimeBalance';

function formatCurrency(v: number) {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AccountOverview({ transactions }: { transactions?: any[] }) {
  // compute balance from transactions fallback
  const computed = (transactions || []).reduce((acc, t) => acc + ((t.direction === 'credit') ? Number(t.amount) : -Number(t.amount)), 0);
  const { balance } = useRealtimeBalance(computed);

  const spark = (transactions || []).slice(-8).map(t => (t.direction === 'credit' ? 1 : -1) * Number(t.amount));

  const min = Math.min(...spark, 0);
  const max = Math.max(...spark, 1);

  // simple sparkline path
  const points = spark.map((v, i) => {
    const x = (i / Math.max(1, spark.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Default account</div>
          <div className="text-2xl font-semibold mt-1">{formatCurrency(balance)}</div>
          <div className="text-xs text-gray-400">Available balance</div>
        </div>
        <div className="w-28 h-12">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <polyline fill="none" stroke="#0284c7" strokeWidth={2} points={points} />
          </svg>
        </div>
      </div>
    </div>
  );
}
