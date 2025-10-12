"use client";

import React, { useState } from 'react';
import axios from 'axios';


export default function TransferForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const form = new FormData(e.currentTarget);
    const receiverEmail = String(form.get('receiverEmail') || '').trim();
    const receiverAccountType = String(form.get('receiverAccountType') || 'personal');
    const amount = Number(form.get('amount') || 0);
    const currency = String(form.get('currency') || 'USD');
    const description = String(form.get('description') || 'Transfer');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail)) {
      setError('Enter a valid email');
      return;
    }
    if (!(receiverAccountType === 'personal' || receiverAccountType === 'business')) {
      setError('Invalid account type');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/transfers', { receiverEmail, receiverAccountType, amount, currency, description }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('Transfer submitted. The receiver will see it as Pending and it will complete shortly.');
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      console.error('Transfer error', err?.response || err);
      setError(err?.response?.data?.error || 'Transfer failed');
    } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-live="polite">
      <input name="receiverEmail" placeholder="Receiver email" className="input" required />
      <select name="receiverAccountType" className="select">
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>
      <input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount" className="input" required />
      <input name="currency" defaultValue="USD" className="input" />
      <input name="description" placeholder="Description" className="input" />
      {error && <div className="text-sm text-red-600">{error}</div>}
      {message && <div className="text-sm text-green-600">{message}</div>}
      <button className="button w-full" disabled={submitting}>{submitting ? 'Sending…' : 'Send'}</button>
    </form>
  );
}
