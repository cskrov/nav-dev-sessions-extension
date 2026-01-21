import browser, { type Tabs } from 'webextension-polyfill';
import { NAV_DOMAIN_SUFFIX } from '@/lib/constants';

type Listener = (domains: string[]) => void;

interface DomainData {
  domain: string;
  lastAccessed: number;
}

class DevDomainsObserver {
  private domains: DomainData[] = [];
  private listeners: Listener[] = [];
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();

    browser.tabs.onCreated.addListener((tab) => this.handleTabs(tab));
    browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.handleTabs(tab);
      }
    });
  }

  private async init() {
    this.domains = await this.getStoredDomains();
    const tabs = await browser.tabs.query({ url: `*://*${NAV_DOMAIN_SUFFIX}/*` });
    this.handleTabs(...tabs);
  }

  private handleTabs(...tabs: Tabs.Tab[]) {
    for (const tab of tabs) {
      if (tab.url === undefined || !URL.canParse(tab.url)) {
        return;
      }

      const url = new URL(tab.url);
      const domain = url.hostname;

      if (!domain.endsWith(NAV_DOMAIN_SUFFIX)) {
        return;
      }

      const domainData: DomainData = { domain, lastAccessed: tab.lastAccessed ?? 0 };

      if (!this.hasDomain(domain)) {
        this.setDomains([...this.domains, domainData]);
      } else {
        this.setDomains(this.domains.map((d) => (d.domain === domain ? domainData : d)));
      }
    }
  }

  private setDomains(domains: DomainData[]) {
    this.domains = domains.toSorted((a, b) => b.lastAccessed - a.lastAccessed);
    this.notifyListeners();
    // Store updated domains in sync storage.
    browser.storage.sync.set({ domains: this.domains });
  }

  private async getStoredDomains(): Promise<DomainData[]> {
    const { domains } = await browser.storage.sync.get('domains');

    if (domains === undefined || !isDomainDataArray(domains)) {
      return [];
    }

    return domains;
  }

  hasDomain = (domain: string) => this.domains.some((d) => d.domain === domain);
  hasTab = (tab: DomainData) => this.hasDomain(tab.domain);

  private async notifyListeners() {
    const domains = await this.getDomains();

    for (const listener of this.listeners) {
      listener(domains);
    }
  }

  public getDomains = async () => {
    await this.initPromise;
    return this.domains.map((d) => d.domain);
  };

  public addListener(listener: Listener) {
    this.listeners.push(listener);

    return () => this.removeListener(listener);
  }

  public removeListener(listener: Listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  public deleteDomain(domain: string) {
    this.setDomains(this.domains.filter((d) => d.domain !== domain));
  }
}

export const devDomainsObserver = new DevDomainsObserver();

const isDomainDataArray = (value: unknown): value is DomainData[] =>
  Array.isArray(value) && value.every((item) => item !== null && typeof item === 'object');
