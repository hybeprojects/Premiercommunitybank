"use client";

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  if (typeof window === 'undefined') return null;
  const host = process.env.NEXT_PUBLIC_API_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
  socket = io(host, {
    transports: ['websocket'],
    withCredentials: true
  });
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
