import browser from 'webextension-polyfill';

interface Tab {
  domain: string;
  port: string;
  lastAccessed: number;
}

export const getSortedTabDomains = async () => {
  const tabList = await browser.tabs.query({ url: 'https://*.dev.nav.no/*' });

  const tabs: Tab[] = [];

  for (const { url, lastAccessed = 0 } of tabList) {
    if (url === undefined) {
      continue;
    }

    const parsedUrl = new URL(url);

    tabs.push({
      domain: parsedUrl.hostname,
      port: parsedUrl.port,
      lastAccessed,
    });
  }

  return tabs;
};

export const onSortedTabDomains = async (callback: (domains: Tab[]) => void) => {
  const domains = await getSortedTabDomains();
  console.log('Sorted tab domains:', domains);
  callback(domains);

  browser.tabs.onCreated.addListener(async () => {
    const domains = await getSortedTabDomains();
    console.log('Sorted tab domains (onCreated):', domains);
    callback(domains);
  });

  browser.tabs.onUpdated.addListener(async () => {
    const domains = await getSortedTabDomains();
    console.log('Sorted tab domains (onUpdated):', domains);
    callback(domains);
  });

  browser.tabs.onRemoved.addListener(async () => {
    const domains = await getSortedTabDomains();
    console.log('Sorted tab domains (onRemoved):', domains);
    callback(domains);
  });
};
