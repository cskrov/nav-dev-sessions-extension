import browser, { type Cookies } from 'webextension-polyfill';
import { getAllCookies, LOCALHOST, NAV_DOMAIN_SUFFIX } from '@/lib/constants';

/**
 * Gets all parent domains for a given domain.
 * For example, for "mine-klager.intern.dev.nav.no", returns:
 * [".intern.dev.nav.no", ".dev.nav.no", ".nav.no"]
 */
const getParentDomains = (domain: string): string[] => {
  const parts = domain.split('.');
  const parentDomains: string[] = [];

  // Start from the second level (skip the first subdomain)
  for (let i = 1; i < parts.length - 1; i++) {
    const parentDomain = `.${parts.slice(i).join('.')}`;
    parentDomains.push(parentDomain);
  }

  return parentDomains;
};

export type CookieChangeListener = (cookies: Cookies.Cookie[]) => void;

class CookieObserver {
  // Map of cookies for each domain.
  private cookies: Map<string, Cookies.Cookie[]> = new Map();
  private listeners: Map<string, CookieChangeListener[]> = new Map();
  private readonly initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();

    browser.cookies.onChanged.addListener(async ({ cookie, removed }: Cookies.OnChangedChangeInfoType) => {
      if (cookie.domain === LOCALHOST || cookie.domain.endsWith(NAV_DOMAIN_SUFFIX)) {
        console.debug(`Cookie ${removed ? 'removed' : 'changed'} for ${cookie.domain}: ${cookie.name}=${cookie.value}`);

        const existing = this.cookies.get(cookie.domain);

        if (removed) {
          if (existing !== undefined && existing.length !== 0) {
            this.cookies.set(
              cookie.domain,
              existing.filter((c) => c.name !== cookie.name),
            );
            return this.notifyListeners(cookie.domain);
          }
          return;
        }

        if (existing !== undefined) {
          this.cookies.set(cookie.domain, existing.concat(cookie));
        } else {
          this.cookies.set(cookie.domain, [cookie]);
        }

        return this.notifyListeners(cookie.domain);
      }
    });
  }

  async init() {
    const devCookies = await getAllCookies({ domain: NAV_DOMAIN_SUFFIX });
    const localhostCookies = await getAllCookies({ domain: LOCALHOST });

    this.cookies.set(LOCALHOST, localhostCookies);

    for (const cookie of devCookies) {
      const domain = cookie.domain;

      const existing = this.cookies.get(domain);

      if (existing === undefined) {
        this.cookies.set(domain, [cookie]);
      } else {
        existing.push(cookie);
      }
    }
  }

  private notifyListeners(cookieDomain: string) {
    const notifiedDomains = new Set<string>();

    // Notify listeners for the exact domain
    this.notifyListenersForDomain(cookieDomain);
    notifiedDomains.add(cookieDomain);

    // If this is a parent domain cookie (starts with .), notify listeners for child domains
    if (cookieDomain.startsWith('.')) {
      for (const listenerDomain of this.listeners.keys()) {
        // Skip if already notified
        if (notifiedDomains.has(listenerDomain)) {
          continue;
        }

        // Check if the listener domain is a child of the cookie domain
        if (listenerDomain.endsWith(cookieDomain) || listenerDomain.endsWith(cookieDomain.slice(1))) {
          this.notifyListenersForDomain(listenerDomain);
          notifiedDomains.add(listenerDomain);
        }
      }
    }
  }

  private notifyListenersForDomain(domain: string) {
    const listeners = this.listeners.get(domain);

    if (listeners === undefined) {
      return;
    }

    // Use getCookies to get all applicable cookies (including parent domains)
    this.getCookies(domain).then((cookies) => {
      for (const listener of listeners) {
        listener(cookies);
      }
    });
  }

  public getCookies = async (domain: string): Promise<Cookies.Cookie[]> => {
    await this.initPromise;

    const result: Cookies.Cookie[] = [];
    const seenCookieKeys = new Set<string>();

    const addCookie = (cookie: Cookies.Cookie) => {
      // Deduplicate by cookie name and domain
      const key = `${cookie.domain}:${cookie.name}`;
      if (!seenCookieKeys.has(key)) {
        seenCookieKeys.add(key);
        result.push(cookie);
      }
    };

    // Check exact domain match
    const exactMatch = this.cookies.get(domain);
    if (exactMatch !== undefined) {
      for (const cookie of exactMatch) {
        addCookie(cookie);
      }
    }

    // Check parent domains (for domain cookies like .dev.nav.no)
    const parentDomains = getParentDomains(domain);
    for (const parentDomain of parentDomains) {
      const parentCookies = this.cookies.get(parentDomain);
      if (parentCookies !== undefined) {
        for (const cookie of parentCookies) {
          addCookie(cookie);
        }
      }
    }

    return result;
  };

  public addListener(domain: string, listener: CookieChangeListener) {
    // Add the listener to the list for the given domain.
    const existing = this.listeners.get(domain);

    if (existing === undefined) {
      this.listeners.set(domain, [listener]);
    } else {
      existing.push(listener);
    }

    // Immediately invoke the listener with the current cookies.
    this.getCookies(domain).then((cookies) => {
      listener(cookies);
    });

    // Return a function to remove the listener.
    return () => this.removeListener(domain, listener);
  }

  public removeListener(domain: string, listener: CookieChangeListener) {
    const existing = this.listeners.get(domain);

    if (existing !== undefined) {
      this.listeners.set(
        domain,
        existing.filter((l) => l !== listener),
      );
    }
  }
}

export const cookieObserver = new CookieObserver();
