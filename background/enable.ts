import type { Tabs } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

export const getIsEnabled = (url: string | undefined): url is string => {
  if (url === undefined) {
    return false;
  }

  const { hostname } = new URL(url);

  return hostname === 'localhost' || hostname.endsWith('.dev.nav.no');
};

const updateBadge = ({ url, id }: Tabs.Tab) => {
  if (getIsEnabled(url)) {
    browser.action.enable(id);
    console.debug(`Enabled extension for tab ${id} ${url}`);
  } else {
    browser.action.disable(id);
    browser.action.setBadgeText({ text: '' });
  }
};

export const handleEnabled = async () => {
  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      updateBadge(tab);
    }
  });

  const tabs = await browser.tabs.query({});

  for (const tab of tabs) {
    updateBadge(tab);
  }
};
