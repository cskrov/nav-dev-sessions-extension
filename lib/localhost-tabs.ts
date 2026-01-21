import browser from 'webextension-polyfill';
import { LOCALHOST } from '@/lib/constants';

/**
 * Extracts the port number from a localhost URL.
 * Returns null if the URL is not a valid localhost URL or has no port.
 */
const getPortFromUrl = (url: string): number | null => {
  if (!URL.canParse(url)) {
    return null;
  }

  const parsedUrl = new URL(url);

  if (parsedUrl.hostname !== LOCALHOST) {
    return null;
  }

  // If no port is specified, default ports are used (80 for http, 443 for https)
  if (parsedUrl.port === '') {
    return parsedUrl.protocol === 'https:' ? 443 : 80;
  }

  const port = Number.parseInt(parsedUrl.port, 10);

  return Number.isNaN(port) ? null : port;
};

/**
 * Gets the suggested port from localhost tabs.
 * Priority:
 * 1. Active tab in current window if it's a localhost tab
 * 2. Most recently accessed localhost tab
 *
 * Returns null if no localhost tabs are found.
 */
export const getSuggestedPortFromTabs = async (): Promise<number | null> => {
  // First, check if the active tab is a localhost tab
  const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
  const [activeTab] = activeTabs;

  if (activeTab?.url !== undefined) {
    const activePort = getPortFromUrl(activeTab.url);

    if (activePort !== null) {
      return activePort;
    }
  }

  // If active tab is not localhost, find the most recently accessed localhost tab
  const allTabs = await browser.tabs.query({ url: ['http://localhost/*', 'https://localhost/*'] });

  if (allTabs.length === 0) {
    return null;
  }

  // Sort by lastAccessed descending (most recent first)
  const sortedTabs = allTabs
    .filter((tab) => tab.lastAccessed !== undefined)
    .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));

  const mostRecentTab = sortedTabs[0];

  if (mostRecentTab?.url === undefined) {
    return null;
  }

  return getPortFromUrl(mostRecentTab.url);
};
