"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';


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
      const { data } = await axios.post(`${API}/api/auth/login`, { email, password, accountType });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(`/dashboard/${accountType}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-card">
      <h1 className="text-2xl font-semibold mb-2">Welcome to Premierbank</h1>
      <p className="text-gray-600 mb-6">Sign in to your account</p>
      <form onSubmit={onLogin} className="space-y-4">
        <div className="text-sm text-center text-gray-500">New here? <a href="/signup" className="text-brand font-medium">Create an account</a></div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Account Type</label>
          <select className="select" value={accountType} onChange={e => setAccountType(e.target.value as any)}>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="button w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  );
}
