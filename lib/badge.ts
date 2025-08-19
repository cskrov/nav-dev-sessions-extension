import browser from 'webextension-polyfill';

export const setBadgeCount = (employee: boolean, user: boolean) => {
  const count = (employee ? 1 : 0) + (user ? 1 : 0);

  browser.action.setBadgeText({ text: count.toString() });
  browser.action.setBadgeBackgroundColor({ color: employee || user ? '#06893A' : '#C30000' });
};
