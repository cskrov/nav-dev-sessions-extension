import browser from 'webextension-polyfill';
import { getStoredDomains } from '@/lib/domains';

export const startDomainsSync = () => {
  browser.tabs.onCreated.addListener(async ({ url }) => listener(url));
  browser.tabs.onUpdated.addListener(async (_tabId, _changeInfo, { url }) => listener(url));
};

const listener = async (url: string | undefined) => {
  if (url === undefined) {
    return;
  }

  const domain = new URL(url).hostname;

  const existingDomains = await getStoredDomains();

  if (existingDomains.includes(domain)) {
    return;
  }

  browser.storage.sync.set({ domains: [...existingDomains, domain] });
};
