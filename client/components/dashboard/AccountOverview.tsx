"use client";

import React, { useState } from 'react';
import { useRealtimeBalance } from '../hooks/useRealtimeBalance';
import { getSocket } from '../../lib/socket';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, EyeOff, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function formatCurrency(v, isHidden) {
  return isHidden ? '****' : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MOCK_DATA = [
  { name: '7d ago', balance: 5234.56 },
  { name: '6d ago', balance: 5300.12 },
  { name: '5d ago', balance: 5250.78 },
  { name: '4d ago', balance: 5400.99 },
  { name: '3d ago', balance: 5350.45 },
  { name: '2d ago', balance: 5500.67 },
  { name: 'Yesterday', balance: 5480.33 },
  { name: 'Today', balance: 5600.00 },
];

export default function AccountOverview({ transactions }) {
  const computed = (transactions || []).reduce((acc, t) => acc + ((t.direction === 'credit') ? Number(t.amount) : -Number(t.amount)), 0);
  const { balance, setBalance } = useRealtimeBalance(computed);
  const [isHidden, setIsHidden] = useState(false);

  React.useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onBal = (p) => { if (typeof p.balance === 'number') setBalance(p.balance); };
    s.on('balance_update', onBal);
    return () => { s.off('balance_update', onBal); };
  }, [setBalance]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Checking Account</h2>
            <button onClick={() => setIsHidden(!isHidden)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Primary account</p>
        </div>
        <div className="text-right">
          <p className={cn('text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white', isHidden && 'blur-sm')}>
            {formatCurrency(balance, isHidden)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
        </div>
      </div>
      <div className="h-32 sm:h-40 -mx-4 sm:-mx-6 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_DATA} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #ccc',
                borderRadius: '8px',
                color: '#333'
              }}
              formatter={(value) => { const amount = Number(value); return [`$${amount.toFixed(2)}`, 'Balance']; }}
            />
            <Area type="monotone" dataKey="balance" stroke="#8884d8" fillOpacity={1} fill="url(#balanceGradient)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
        <QuickActionButton icon={<TrendingUp size={20} />} label="Deposit" />
        <QuickActionButton icon={<TrendingDown size={20} />} label="Withdraw" />
        <QuickActionButton icon={<ArrowRight size={20} />} label="Transfer" />
        <QuickActionButton icon={<span>...</span>} label="More" />
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
      <div className="text-indigo-500 dark:text-indigo-400 mb-1">{icon}</div>
      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
    </button>
  );
}