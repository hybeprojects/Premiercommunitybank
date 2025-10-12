"use client";

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  if (typeof window === 'undefined') return null;
  const apiServer = (window as any).__API_SERVER_URL__ || (process.env.NEXT_PUBLIC_API_SERVER_URL) || `${window.location.protocol}//${window.location.hostname}:5000`;
  const host = window.location.hostname === 'localhost' ? apiServer : window.location.origin;
  socket = io(host, { transports: ['websocket'] });
  // auto-reconnect handled by socket.io-client
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
