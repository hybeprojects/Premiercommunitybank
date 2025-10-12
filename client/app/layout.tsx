import './globals.css';
import type { ReactNode } from 'react';
import Header from '../components/common/Header';
import RouteTransition from '../components/common/RouteTransition';

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

      // Remove attributes injected by privacy extensions (e.g., DuckDuckGo) before React hydrates
      function removeInjectedAttributes() {
        try {
          var walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT, null, false);
          var node = null;
          while(node = walker.nextNode()) {
            if(node.attributes && node.attributes.length) {
              for(var i = node.attributes.length - 1; i >= 0; i--) {
                var attr = node.attributes[i];
                if(attr && attr.name && attr.name.indexOf('data-ddg') === 0) {
                  node.removeAttribute(attr.name);
                }
              }
            }
          }
        } catch (e) {
          // Non-fatal
          console.error('Error removing injected attributes', e);
        }
      }

      // Run removeInjectedAttributes as early as possible
      if(document.readyState === 'loading') {
        removeInjectedAttributes();
        document.addEventListener('DOMContentLoaded', removeInjectedAttributes);
      } else {
        removeInjectedAttributes();
      }

    }catch(e){
      console.error('restoreFetchScript error', e);
    }
  })();`;

  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: restoreFetchScript }} />
        <Header />
        <main className="min-h-[calc(100vh-3.5rem)] pb-16">{children}</main>
      </body>
    </html>
  );
}
