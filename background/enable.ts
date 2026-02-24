import type { Tabs } from 'webextension-polyfill';
import browser from 'webextension-polyfill';
import { getBadgeCount } from '@/lib/badge';
import { LOCALHOST } from '@/lib/constants';

export const getIsEnabled = (url: string | undefined): url is string => {
  if (url === undefined || !URL.canParse(url)) {
    return false;
  }

  const { hostname } = new URL(url);

  return hostname === LOCALHOST || hostname.endsWith('.nav.no');
};

const updateBadge = ({ url, id }: Tabs.Tab) => {
  if (getIsEnabled(url)) {
    browser.action.enable(id);
    browser.action.setBadgeText({ text: getBadgeCount().toString(), tabId: id });
    console.debug(`Enabled extension for tab ${id} ${url}`);
  } else {
    browser.action.disable(id);
    browser.action.setBadgeText({ text: '', tabId: id });
  }
};

export const handleEnabled = async () => {
  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      updateBadge(tab);
    }
  });

  browser.tabs.onCreated.addListener(updateBadge);

  const tabs = await browser.tabs.query({});

  for (const tab of tabs) {
    updateBadge(tab);
  }
};
