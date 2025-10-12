import './globals.css';
import type { ReactNode } from 'react';
import Header from '../components/common/Header';

export const metadata = {
  title: 'Premierbank',
  description: 'Modern online banking simulation',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const restoreFetchScript = `(function(){
    try{
      // Preserve native fetch if not already preserved
      if(!window.__nativeFetch){
        window.__nativeFetch = window.fetch.bind(window);
      } else {
        // restore original fetch in case third-party overwrote it
        window.fetch = window.__nativeFetch;
      }
      // Global error hooks to surface failures in dev overlay
      window.addEventListener('unhandledrejection', function(e){
        console.error('Unhandled promise rejection:', e.reason);
      });
      window.addEventListener('error', function(e){
        console.error('Global error caught:', e.error || e.message);
      });
    }catch(e){
      console.error('restoreFetchScript error', e);
    }
  })();`;

  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: restoreFetchScript }} />
        {/* Header component */}
        <div id="page-header">
          {/* Client component loaded here */}
          <script dangerouslySetInnerHTML={{ __html: "" }} />
        </div> /* Header will be mounted in client via Header import on pages */
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
