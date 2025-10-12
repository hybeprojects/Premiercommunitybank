"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

export function Toast({ message, type, onClose }) {
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;
  const colors = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg text-white shadow-lg ${colors}`}
    >
      <Icon className="mr-3" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
        <X size={18} />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed bottom-5 right-5 z-50">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}