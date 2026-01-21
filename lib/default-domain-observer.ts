import { devDomainsObserver } from '@/lib/dev-domains-observer';

type Listener = (domain: string | null) => void;

class DefaultDomainObserver {
  private defaultDomain: string | null = null;
  private listeners: Listener[] = [];
  private readonly initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();

    devDomainsObserver.addListener(([domain = null]) => {
      this.setDefaultDomain(domain);
    });
  }

  private async init() {
    const [domain = null] = await devDomainsObserver.getDomains();
    this.defaultDomain = domain;
  }

  get = async () => {
    await this.initPromise;
    return this.defaultDomain;
  };

  addListener(listener: Listener) {
    this.listeners.push(listener);
    return () => this.removeListener(listener);
  }

  removeListener(listener: Listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private setDefaultDomain(domain: string | null) {
    this.defaultDomain = domain;
    this.notifyListeners();
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.defaultDomain);
    }
  }
}

export const defaultDomainObserver = new DefaultDomainObserver();
