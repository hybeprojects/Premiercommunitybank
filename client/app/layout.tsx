import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Premierbank',
  description: 'Modern online banking simulation',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="header-inner">
            <div className="brand">
              <span>🏦</span>
              <span>Premierbank</span>
            </div>
            <div className="text-sm text-gray-600">Secure Banking</div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)] pb-16">{children}</main>
        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            <button className="bottom-nav-btn">Home</button>
            <button className="bottom-nav-btn">Accounts</button>
            <button className="bottom-nav-btn">Transfer</button>
            <button className="bottom-nav-btn">Activity</button>
            <button className="bottom-nav-btn">More</button>
          </div>
        </nav>
      </body>
    </html>
  );
}
