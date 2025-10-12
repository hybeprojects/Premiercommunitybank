"use client";

import useSWR from 'swr';
import axios from 'axios';
import { useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const fetcher = (url: string) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.data);

export default function PersonalDashboard() {
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) window.location.href = '/';
  }, []);

  const { data: txs } = useSWR(`${API}/api/transactions`, fetcher, { refreshInterval: 5000 });

  return (
    <div className="container-page mt-6">
      <h1 className="text-xl font-semibold mb-4">Personal Overview</h1>
      <div className="dashboard-grid">
        <div className="card md:col-span-2">
          <h2 className="font-medium mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {Array.isArray(txs) && txs.length ? txs.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between border rounded-md p-2">
                <div>
                  <div className="text-sm text-gray-700">{t.description || 'Transfer'}</div>
                  <div className="text-xs text-gray-500">{t.direction} • {t.status}</div>
                </div>
                <div className="font-medium">{t.direction === 'debit' ? '-' : '+'}${Number(t.amount).toFixed(2)}</div>
              </div>
            )) : <div className="text-sm text-gray-500">No transactions yet</div>}
          </div>
        </div>
        <div className="card">
          <h2 className="font-medium mb-3">Quick Actions</h2>
          <QuickTransfer />
        </div>
      </div>
    </div>
  );
}

function QuickTransfer() {
  const send = async (e: any) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    await axios.post(`${API}/api/transfers`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    e.currentTarget.reset();
  };
  return (
    <form onSubmit={send} className="space-y-3">
      <input name="receiverEmail" placeholder="Receiver email" className="input" required />
      <select name="receiverAccountType" className="select">
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>
      <input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount" className="input" required />
      <input name="currency" defaultValue="USD" className="input" />
      <input name="description" placeholder="Description" className="input" />
      <button className="button w-full">Send</button>
    </form>
  );
}
