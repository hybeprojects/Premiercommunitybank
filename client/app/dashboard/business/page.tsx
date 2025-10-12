"use client";

import useSWR from 'swr';
import axios from 'axios';
import TransactionList from '../../../components/transactions/TransactionList';
import TransferForm from '../../../components/transfers/TransferForm';
import { useAuthGuard } from '../../../components/hooks/useAuthGuard';

const fetcher = (url: string) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.data);

export default function BusinessDashboard() {
  useAuthGuard();
  const { data, isLoading, error } = useSWR(`/api/transactions`, fetcher, { refreshInterval: 5000 });

  return (
    <div className="container-page mt-6">
      <h1 className="text-xl font-semibold mb-4">Business Overview</h1>
      <div className="dashboard-grid">
        <div className="card md:col-span-2">
          <h2 className="font-medium mb-3">Recent Activity</h2>
          <TransactionList items={data} isLoading={isLoading} error={error ? 'Failed to load transactions' : null} variant="business" />
        </div>
        <div className="card">
          <h2 className="font-medium mb-3">Quick Actions</h2>
          <TransferForm />
        </div>
      </div>
    </div>
  );
}
