import browser, { type Cookies } from 'webextension-polyfill';
import { DEV_DOMAIN_SUFFIX } from '@/lib/constants';

export type CookieChangeListener = (cookies: Cookies.Cookie[]) => void;

class CookieObserver {
  // Map of cookies for each domain.
  private cookies: Map<string, Cookies.Cookie[]> = new Map();
  private listeners: Map<string, CookieChangeListener[]> = new Map();
  private readonly initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();

    browser.cookies.onChanged.addListener(async ({ cookie, removed }: Cookies.OnChangedChangeInfoType) => {
      if (cookie.domain === 'localhost' || cookie.domain.endsWith(DEV_DOMAIN_SUFFIX)) {
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
    const devCookies = await browser.cookies.getAll({ domain: DEV_DOMAIN_SUFFIX });
    const localhostCookies = await browser.cookies.getAll({ domain: 'localhost' });

    this.cookies.set('localhost', localhostCookies);

    for (const cookie of devCookies) {
      const domain = cookie.domain;

      const existing = this.cookies.get(domain);

      if (existing === undefined) {
        this.cookies.set(domain, []);
      } else {
        existing.push(cookie);
      }
    }
  }

  private notifyListeners(domain: string) {
    const listeners = this.listeners.get(domain);

    if (listeners === undefined) {
      return;
    }

    const cookies = this.cookies.get(domain);

    if (cookies === undefined) {
      return;
    }

    for (const listener of listeners) {
      listener(cookies);
    }
  }

  public getCookies = async (domain: string): Promise<Cookies.Cookie[]> => {
    await this.initPromise;
    return this.cookies.get(domain) ?? [];
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
    const cookies = this.cookies.get(domain);

    if (cookies !== undefined) {
      listener(cookies);
    }

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
