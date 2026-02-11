/**
 * Service Worker registration helper
 * Registers the service worker and handles updates
 */

export function registerServiceWorker(): void {
  // Only register in production and if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return;
  }

  // Register on page load
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, notify user
              console.log('New version available! Refresh to update.');
              
              // Optionally auto-update by sending SKIP_WAITING message
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Handle controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker activated');
      // Optionally reload the page to use the new service worker
      // window.location.reload();
    });
  });
}
