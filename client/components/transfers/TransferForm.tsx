"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DollarSign, User, Send, Loader } from 'lucide-react';
import { ToastContainer, Toast } from '../common/Toast';

const RECENT_PAYEES = [
  { name: 'John Doe', email: 'john.doe@example.com', avatar: '/avatars/john.png' },
  { name: 'Jane Smith', email: 'jane.smith@example.com', avatar: '/avatars/jane.png' },
  { name: 'Peter Jones', email: 'peter.jones@example.com', avatar: '/avatars/peter.png' },
];

export default function TransferForm() {
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail)) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    if (Number(amount) <= 0) {
      addToast('Amount must be greater than zero.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/transfers', {
        receiverEmail,
        amount: Number(amount),
        currency: 'USD',
        description: 'Online Transfer'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      addToast('Transfer successful!', 'success');
      setReceiverEmail('');
      setAmount('');
    } catch (err) {
      const errorMessage = err.response?.data?.error?.details || err.response?.data?.error || 'An unexpected error occurred.';
      addToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Send Money</h3>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recent Payees</h4>
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {RECENT_PAYEES.map(payee => (
            <button key={payee.email} onClick={() => setReceiverEmail(payee.email)} className="flex flex-col items-center text-center">
              <img src={payee.avatar} alt={payee.name} className="w-12 h-12 rounded-full object-cover border-2 border-transparent hover:border-indigo-500 transition-all" />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{payee.name}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            value={receiverEmail}
            onChange={(e) => setReceiverEmail(e.target.value)}
            placeholder="Receiver's email"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            required
          />
        </div>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            required
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader className="animate-spin" /> : <Send size={20} className="mr-2" />}
          {submitting ? 'Sending...' : 'Send Money'}
        </motion.button>
      </form>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}