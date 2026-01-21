import browser from 'webextension-polyfill';
import { getStoredDomains } from '@/lib/domains';

export const startDomainsSync = () => {
  browser.tabs.onCreated.addListener(async ({ url }) => listener(url));
  browser.tabs.onUpdated.addListener(async (_tabId, _changeInfo, { url }) => listener(url));
};

const listener = async (url: string | undefined) => {
  if (url === undefined || !URL.canParse(url)) {
    return;
  }

  const parsed = URL.parse(url);

  if (parsed === null) {
    return;
  }

  const { hostname, protocol } = parsed;

  if (protocol !== 'http:' && protocol !== 'https:') {
    return;
  }

  const existingDomains = await getStoredDomains();

  if (existingDomains.includes(hostname)) {
    return;
  }

  browser.storage.sync.set({ domains: [...existingDomains, hostname] });
};
