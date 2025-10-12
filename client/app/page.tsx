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
      const { data } = await axios.post('/api/auth/login', { email, password, accountType });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(`/dashboard/${accountType}`);
    } catch (err: any) {
      console.error('Login error', err?.response || err);
      const resp = err?.response?.data?.error;
      let message = 'Login failed';
      if (typeof resp === 'string') message = resp;
      else if (resp && typeof resp === 'object') {
        if (resp.details) message = resp.details;
        else if (resp.message) message = resp.message;
        else if (resp.code) message = resp.code;
        else message = JSON.stringify(resp);
      } else if (err?.message) message = err.message;
      setError(message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-card">
      <h1 className="text-2xl font-semibold mb-2">Welcome to Premierbank</h1>
      <p className="text-gray-600 mb-6">Sign in to your account</p>
      <form onSubmit={e => e.preventDefault()} className="space-y-4">
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
