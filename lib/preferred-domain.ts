import browser from 'webextension-polyfill';
import { CookieName } from '@/lib/constants';

export const getPreferredEmployeeDomainSetting = async () => getPreferredDomainSetting(CookieName.EMPLOYEE);

export const getPreferredUserDomainSetting = async () => getPreferredDomainSetting(CookieName.USER);

export const getPreferredDomainSetting = async (key: CookieName) => {
  const { [key]: preferredDomain } = await browser.storage.sync.get(key);

  console.log(`Preferred ${key} domain setting:`, preferredDomain);

  if (typeof preferredDomain === 'string' && preferredDomain.endsWith('.dev.nav.no')) {
    return preferredDomain;
  }

  return null;
};
