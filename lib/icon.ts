import browser from 'webextension-polyfill';

const NORMAL_ICONS = {
  192: 'images/logo192.png',
  512: 'images/logo512.png',
};

const DISABLED_ICONS = {
  192: 'images/logo192-disabled.png',
  512: 'images/logo512-disabled.png',
};

export const setIconEnabled = (enabled: boolean) => {
  browser.action.setIcon({
    path: enabled ? NORMAL_ICONS : DISABLED_ICONS,
  });
};
