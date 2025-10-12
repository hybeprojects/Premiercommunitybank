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

      // MutationObserver to catch attributes added after initial pass (some extensions modify DOM later)
      var observer;
      try {
        observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            try {
              if(mutation.type === 'attributes' && mutation.attributeName && mutation.attributeName.indexOf('data-ddg') === 0) {
                mutation.target.removeAttribute(mutation.attributeName);
              }
              if(mutation.addedNodes && mutation.addedNodes.length) {
                for(var j=0;j<mutation.addedNodes.length;j++){
                  var n = mutation.addedNodes[j];
                  if(n && n.nodeType === 1) {
                    var attrs = n.attributes;
                    if(attrs && attrs.length){
                      for(var k = attrs.length - 1; k >= 0; k--) {
                        var a = attrs[k];
                        if(a && a.name && a.name.indexOf('data-ddg') === 0) {
                          n.removeAttribute(a.name);
                        }
                      }
                    }
                  }
                }
              }
            } catch(e) { /* ignore per-node errors */ }
          });
        });

        observer.observe(document, { attributes: true, childList: true, subtree: true });

        // Stop observing after a short grace period to avoid long-running observers
        setTimeout(function(){ try{ observer.disconnect(); } catch(e){} }, 5000);
      } catch(e) {
        // ignore if MutationObserver not available
      }

      // Run removeInjectedAttributes as early as possible
      try {
        if(document.readyState === 'loading') {
          removeInjectedAttributes();
          document.addEventListener('DOMContentLoaded', removeInjectedAttributes);
        } else {
          removeInjectedAttributes();
        }
      } catch(e){ /* ignore */ }

    }catch(e){
      console.error('restoreFetchScript error', e);
    }
  })();`;

  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: restoreFetchScript }} />
        <Header />
        <RouteTransition />
        <main className="min-h-[calc(100vh-3.5rem)] pb-16">{children}</main>
      </body>
    </html>
  );
}
