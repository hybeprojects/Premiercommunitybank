"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api';

export default function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/login', { email, password, accountType });
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(`/dashboard/${accountType}`);
    } catch (err: any) {
      const resp = err?.response?.data?.error;
      setError(resp?.details || resp || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <form className="space-y-3" onSubmit={onLogin}>
        <input className="input w-full" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select className="select w-full" value={accountType} onChange={(e) => setAccountType(e.target.value as 'personal' | 'business')}>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
        </select>
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button className="button w-full" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
}
