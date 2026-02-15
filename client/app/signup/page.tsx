"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    accountType: 'personal'
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/register', {
        email: form.email,
        fullName: form.fullName,
        password: form.password,
        accountType: form.accountType
      });
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(`/dashboard/${form.accountType}`);
    } catch (err: any) {
      const resp = err?.response?.data?.error;
      setError(resp?.details || resp || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create account</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input className="input w-full" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        <input className="input w-full" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input w-full" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input className="input w-full" placeholder="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
        <select className="select w-full" value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
        </select>
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button className="button w-full" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
      </form>
    </main>
  );
}
