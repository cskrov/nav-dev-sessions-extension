import browser from 'webextension-polyfill';
import { CookieName } from '@/lib/constants';

type Listener = (domain: string | null) => void;

class PreferredDomainObserver {
  private preferredDomain: string | null = null;
  private listeners: Listener[] = [];
  private readonly storageKey: string;
  private readonly initPromise: Promise<void>;

  constructor(cookieName: CookieName) {
    this.storageKey = `preferredDomain_${cookieName}`;

    this.initPromise = this.init();

    browser.storage.sync.onChanged.addListener((changes) => {
      const change = changes[this.storageKey];

      if (change === undefined) {
        return;
      }

      const { newValue, oldValue } = change;

      if (newValue === oldValue) {
        return;
      }

      if (typeof newValue === 'string' || newValue === null) {
        this.preferredDomain = newValue;
        this.notifyListeners();
        // No need to store the preferred domain, as this is triggered by a storage event.
      }
    });
  }

  private async init() {
    this.preferredDomain = await this.getStoredPreferredDomain();
  }

  public addListener(listener: Listener) {
    this.listeners.push(listener);

    return () => this.removeListener(listener);
  }

  public removeListener(listener: Listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  public getPreferredDomain = async () => {
    await this.initPromise;
    return this.preferredDomain;
  };

  private async getStoredPreferredDomain(): Promise<string | null> {
    const result = await browser.storage.sync.get(this.storageKey);
    const value = result[this.storageKey];

    return typeof value === 'string' || value === null ? value : null;
  }

  public setPreferredDomain(domain: string | null) {
    this.preferredDomain = domain;
    this.notifyListeners();
    browser.storage.sync.set({ [this.storageKey]: this.preferredDomain });
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.preferredDomain);
    }
  }
}

export const preferredEmployeeDomainObserver = new PreferredDomainObserver(CookieName.EMPLOYEE);

export const preferredUserDomainObserver = new PreferredDomainObserver(CookieName.USER);
