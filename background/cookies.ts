import { cookieObserver } from '@/lib/cookie-observer';
import { onMappingsChange } from '@/lib/mappings';

export const startCookiesSync = () => {
  const unsubscribers: Map<string, () => void> = new Map();

  onMappingsChange((mappings) => {
    // Get unique domains from mappings
    const domains = new Set(mappings.map((m) => m.domain));

    // Remove listeners for domains that are no longer in mappings
    for (const [domain, unsubscribe] of unsubscribers) {
      if (!domains.has(domain)) {
        unsubscribe();
        unsubscribers.delete(domain);
        console.log('Removed cookie listener for domain', domain);
      }
    }

    // Add listeners for new domains
    for (const domain of domains) {
      if (!unsubscribers.has(domain)) {
        const unsubscribe = cookieObserver.addListener(domain, (cookies) => {
          console.log(`Cookies changed for ${domain}:`, cookies);
        });
        unsubscribers.set(domain, unsubscribe);
        console.log('Added cookie listener for domain', domain);
      }
    }
  });
};
