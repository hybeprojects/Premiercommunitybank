"use client";

import useSWR from 'swr';
import Header from '../../../components/common/Header';
import AccountOverview from '../../../components/dashboard/AccountOverview';
import TransactionList from '../../../components/transactions/TransactionList';
import TransferForm from '../../../components/transfers/TransferForm';
import FinancialInsights from '../../../components/dashboard/FinancialInsights';
import { useAuthGuard } from '../../../components/hooks/useAuthGuard';
import { apiClient } from '../../../lib/api';

const fetcher = (url: string) => apiClient.get(url).then((r) => r.data);

export default function PersonalDashboard() {
  useAuthGuard();
  const { data: transactions, isLoading, error } = useSWR('/api/transactions', fetcher, { refreshInterval: 5000 });

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AccountOverview transactions={transactions} />
            <TransactionList items={transactions} isLoading={isLoading} error={error ? 'Failed to load transactions' : null} />
          </div>
          <div className="space-y-8">
            <TransferForm />
            <FinancialInsights />
          </div>
        </div>
      </main>
    </div>
  );
}
