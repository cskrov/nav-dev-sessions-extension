import browser from 'webextension-polyfill';

/**
 * Detects if the current browser is Firefox by checking for Firefox-specific APIs.
 */
export const isFirefox = typeof browser.runtime.getBrowserInfo === 'function';

/**
 * Cross-browser compatible wrapper for browser.cookies.getAll.
 * Includes firstPartyDomain: null only for Firefox (required for First-Party Isolation).
 */
export const getAllCookies = async (details: browser.Cookies.GetAllDetailsType): Promise<browser.Cookies.Cookie[]> => {
  if (isFirefox) {
    return browser.cookies.getAll({ ...details, firstPartyDomain: null });
  }
  return browser.cookies.getAll(details);
};

export enum CookieName {
  EMPLOYEE = 'io.nais.wonderwall.session',
  USER_DEV = 'sso-dev.nav.no',
  USER_PROD = 'sso-nav.no',
}

export const COOKIE_NAMES = Object.values(CookieName);

export const isCookieName = (name: string): name is CookieName => COOKIE_NAMES.includes(name as CookieName);

export const NAV_DOMAIN_SUFFIX = '.nav.no';
export const DEV_NAV_DOMAIN_SUFFIX = '.dev.nav.no';

export const LOCALHOST = 'localhost';

/**
 * Login domains for obtaining session cookies.
 */
export const LOGIN_DOMAIN_DEV = 'login.ekstern.dev.nav.no';
export const LOGIN_DOMAIN_PROD = 'login.nav.no';

/**
 * Dekoratøren domains.
 */
export const DEKORATØREN_DOMAIN_DEV = 'dekoratoren.ekstern.dev.nav.no';
export const DEKORATØREN_DOMAIN_PROD = 'www.nav.no';

/**
 * External domains that need cookies set when requests originate from localhost.
 */
export const EXTERNAL_DOMAINS_DEV = [LOGIN_DOMAIN_DEV, DEKORATØREN_DOMAIN_DEV] as const;
export const EXTERNAL_DOMAINS_PROD = [LOGIN_DOMAIN_PROD, DEKORATØREN_DOMAIN_PROD] as const;

/**
 * Determines if a domain is a dev domain (*.dev.nav.no).
 */
export const isDevDomain = (domain: string): boolean => domain.endsWith(DEV_NAV_DOMAIN_SUFFIX);

/**
 * Gets the user cookie name that is valid for the given domain.
 * - For dev domains (*.dev.nav.no): sso-dev.nav.no
 * - For prod domains (*.nav.no but not *.dev.nav.no): sso-nav.no
 */
export const getUserCookieName = (domain: string): CookieName.USER_DEV | CookieName.USER_PROD =>
  isDevDomain(domain) ? CookieName.USER_DEV : CookieName.USER_PROD;

/**
 * Checks if a cookie name is a valid user cookie for the given domain.
 */
export const isValidUserCookieForDomain = (cookieName: string, domain: string): boolean =>
  cookieName === getUserCookieName(domain);
