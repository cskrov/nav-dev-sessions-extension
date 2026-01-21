import browser from 'webextension-polyfill';
import { LOCALHOST } from '@/lib/constants';

let currentCount = 0;

const getIsEnabled = (url: string | undefined): url is string => {
  if (url === undefined) {
    return false;
  }

  const { hostname } = new URL(url);

  return hostname === LOCALHOST || hostname.endsWith('.nav.no');
};

export const setBadgeCount = async (count: number) => {
  currentCount = count;
  const text = count.toString();

  browser.action.setBadgeBackgroundColor({ color: count > 0 ? '#06893A' : '#C30000' });

  // Update badge for all enabled tabs
  const tabs = await browser.tabs.query({});

  for (const tab of tabs) {
    if (getIsEnabled(tab.url)) {
      browser.action.setBadgeText({ text, tabId: tab.id });
    }
  }
};

export const clearBadge = async () => {
  currentCount = 0;

  // Clear badge for all tabs
  const tabs = await browser.tabs.query({});

  for (const tab of tabs) {
    browser.action.setBadgeText({ text: '', tabId: tab.id });
  }
};

export const getBadgeCount = () => currentCount;
