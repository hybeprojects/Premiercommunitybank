"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const userRaw = localStorage.getItem('user');
      const hasUser = !!userRaw;
      const isHome = pathname === '/';
      setShow(hasUser && !isHome);
    } catch (e) {
      setShow(false);
    }
  }, [pathname]);

  if (!mounted || !show) return null;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <button className="bottom-nav-btn">Home</button>
        <button className="bottom-nav-btn">Accounts</button>
        <button className="bottom-nav-btn">Transfer</button>
        <button className="bottom-nav-btn">Activity</button>
        <button className="bottom-nav-btn">More</button>
      </div>
    </nav>
  );
}
