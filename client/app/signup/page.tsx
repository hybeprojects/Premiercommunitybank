"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';


export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<'personal'|'business'>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError('Full name is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      // normalize on client as well
      const payload = { email: email.trim().toLowerCase(), password, fullName: fullName.trim(), accountType };
      const { data } = await axios.post('/api/auth/register', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(`/dashboard/${accountType}`);
    } catch (err: any) {
      console.error('Signup error', err?.response || err);
      const serverError = err?.response?.data?.error;
      if (serverError && typeof serverError === 'object') {
        const code = serverError.code || 'SERVER_ERROR';
        const details = serverError.details || JSON.stringify(serverError);
        setError(`${code}: ${details}`);
      } else {
        const serverMessage = err?.response && err.response.data && (err.response.data.error || err.response.data.message);
        const message = serverMessage || err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        setError(message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="text-2xl font-semibold mb-2">Create your Premierbank account</h1>
      <p className="text-gray-600 mb-6">Quickly create an account to access your dashboard.</p>
      <form onSubmit={e => e.preventDefault()} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Full name</label>
          <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirm Password</label>
          <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Account Type</label>
          <select className="select" value={accountType} onChange={e => setAccountType(e.target.value as any)}>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button type="button" className="button w-full" disabled={loading} onClick={onSubmit}>{loading ? 'Creating account...' : 'Create account'}</button>
      </form>
    </div>
  );
}
