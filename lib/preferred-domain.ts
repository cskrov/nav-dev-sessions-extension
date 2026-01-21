import browser from 'webextension-polyfill';
import { CookieName } from '@/lib/constants';

export const onPreferredEmployeeDomainChange = (onChange: (domain: string | null) => void) =>
  onPreferredDomainChange(CookieName.EMPLOYEE, onChange);

export const onPreferredUserDomainChange = (onChange: (domain: string | null) => void) =>
  onPreferredDomainChange(CookieName.USER, onChange);

export const onPreferredDomainChange = async (variant: CookieName, onChange: (domain: string | null) => void) => {
  browser.storage.sync.onChanged.addListener(async (changes) => {
    const change = changes[variant];

    if (change !== undefined) {
      const { newValue } = change;

      if (
        newValue === null ||
        newValue === undefined ||
        (typeof newValue === 'string' && newValue.endsWith('.dev.nav.no'))
      ) {
        onChange(newValue ?? null);
      }
    }
  });

  const preferredDomain = await getPreferredDomainSetting(variant);
  onChange(preferredDomain);
};

export const getPreferredEmployeeDomainSetting = async () => getPreferredDomainSetting(CookieName.EMPLOYEE);

export const getPreferredUserDomainSetting = async () => getPreferredDomainSetting(CookieName.USER);

export const getPreferredDomainSetting = async (cookieName: CookieName) => {
  const { [cookieName]: preferredDomain } = await browser.storage.sync.get(cookieName);

  console.log(`Preferred ${cookieName} domain setting:`, preferredDomain);

  if (typeof preferredDomain === 'string' && preferredDomain.endsWith('.dev.nav.no')) {
    return preferredDomain;
  }

  return null;
};
