import browser from 'webextension-polyfill';

const NORMAL_ICONS = {
  16: 'images/logo16.png',
  32: 'images/logo32.png',
};

const DISABLED_ICONS = {
  16: 'images/logo16-disabled.png',
  32: 'images/logo32-disabled.png',
};

export const setIconEnabled = (enabled: boolean) => {
  browser.action.setIcon({
    path: enabled ? NORMAL_ICONS : DISABLED_ICONS,
  });
};
