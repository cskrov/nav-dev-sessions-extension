import browser from 'webextension-polyfill';

export const getSortedTabDomains = async () => {
  const tabs = await browser.tabs.query({ url: 'https://*.dev.nav.no/*' });

  return tabs
    .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
    .map(({ url }) => url)
    .filter((url) => url !== undefined)
    .map((url) => new URL(url).hostname);
};

export const onSortedTabDomains = async (callback: (domains: string[]) => void) => {
  const domains = await getSortedTabDomains();
  callback(domains);

  browser.tabs.onCreated.addListener(async () => {
    const domains = await getSortedTabDomains();
    callback(domains);
  });

  browser.tabs.onUpdated.addListener(async () => {
    const domains = await getSortedTabDomains();
    callback(domains);
  });

  browser.tabs.onRemoved.addListener(async () => {
    const domains = await getSortedTabDomains();
    callback(domains);
  });
};
