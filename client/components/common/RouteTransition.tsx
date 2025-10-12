"use client";

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteTransition() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef<number | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      try {
        const target = e.target as HTMLElement | null;
        const a = target?.closest && (target.closest('a') as HTMLAnchorElement | null);
        if (!a) return;
        const href = a.getAttribute('href');
        const targetAttr = a.getAttribute('target');
        const download = a.hasAttribute('download');
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || targetAttr === '_blank' || download) return;
        // Only handle internal navigations
        if (href.startsWith('http') && !href.startsWith(location.origin)) return;
        // show overlay
        setVisible(true);
        // fallback hide in case navigation doesn't change pathname
        if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
        hideTimeout.current = window.setTimeout(() => setVisible(false), 5000);
      } catch (e) {
        // ignore
      }
    }

    function onSubmit(e: Event) {
      try {
        const form = e.target as HTMLFormElement;
        if (!form) return;
        setVisible(true);
        if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
        hideTimeout.current = window.setTimeout(() => setVisible(false), 5000);
      } catch (e) {}
    }

    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit, true);

    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit, true);
      if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      // route changed, animate out then hide
      if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
      // keep visible briefly for exit animation
      const t = window.setTimeout(() => setVisible(false), 250);
      prevPath.current = pathname;
      return () => window.clearTimeout(t);
    }
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 opacity-100">
      <div className="flex flex-col items-center gap-4 bg-white/90 dark:bg-black/75 rounded-xl p-6 shadow-lg transform transition-transform duration-300 translate-y-0">
        <div className="w-12 h-12 rounded-full border-4 border-t-brand border-gray-200 animate-spin" />
        <div className="text-sm font-medium">Redirecting...</div>
      </div>
    </div>
  );
}
